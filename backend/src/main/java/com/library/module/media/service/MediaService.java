package com.library.module.media.service;

import com.library.config.MediaStorageProperties;
import com.library.common.exception.BadRequestException;
import com.library.common.exception.ResourceNotFoundException;
import com.library.module.book.entity.Book;
import com.library.module.book.entity.BookImage;
import com.library.module.book.repository.BookImageRepository;
import com.library.module.book.repository.BookRepository;
import com.library.module.media.dto.MediaAssetResponseDTO;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MediaService {
    static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp", "pdf", "epub");

    BookRepository bookRepository;
    BookImageRepository bookImageRepository;
    MediaStorageProperties mediaStorageProperties;

    public List<MediaAssetResponseDTO> getAll() {
        return bookImageRepository.findAll()
                .stream()
                .sorted((first, second) -> second.getCreatedAt().compareTo(first.getCreatedAt()))
                .map(this::toResponse)
                .toList();
    }

    public List<MediaAssetResponseDTO> getByBook(Integer bookId) {
        return bookImageRepository.findByBook_IdOrderByCreatedAtDesc(bookId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public MediaAssetResponseDTO upload(Integer bookId, MultipartFile file, Boolean primary) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui long chon file de upload.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File vuot qua gioi han 10MB.");
        }

        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay sach de gan file."));

        String originalFilename = StringUtils.cleanPath(file.getOriginalFilename() == null ? "file" : file.getOriginalFilename());
        String extension = resolveExtension(originalFilename);

        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("Dinh dang file khong duoc ho tro.");
        }

        try {
            Path storageDirectory = resolveStorageDirectory();
            Files.createDirectories(storageDirectory);

            String safeFilename = UUID.randomUUID() + "-" + originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
            Path targetPath = storageDirectory.resolve(safeFilename).normalize();
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            if (Boolean.TRUE.equals(primary)) {
                bookImageRepository.findByBook_IdOrderByCreatedAtDesc(bookId)
                        .forEach(image -> image.setPrimary(false));
            }

            BookImage bookImage = new BookImage();
            bookImage.setBook(book);
            bookImage.setFileUrl("/library/api/media/files/" + safeFilename);
            bookImage.setPrimary(Boolean.TRUE.equals(primary));
            bookImage.setCreatedAt(LocalDateTime.now());

            return toResponse(bookImageRepository.save(bookImage));
        } catch (IOException exception) {
            throw new BadRequestException("Khong the luu file upload.");
        }
    }

    public void delete(Integer id) {
        BookImage bookImage = bookImageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay tai nguyen."));

        deleteBookImage(bookImage);
    }

    public void deleteByBook(Integer bookId) {
        bookImageRepository.findByBook_IdOrderByCreatedAtDesc(bookId)
                .forEach(this::deleteStoredFileOnly);
        bookImageRepository.deleteByBookId(bookId);
    }

    private void deleteBookImage(BookImage bookImage) {
        if (bookImage == null) {
            return;
        }

        deleteStoredFileOnly(bookImage);
        bookImageRepository.delete(bookImage);
    }

    private void deleteStoredFileOnly(BookImage bookImage) {
        if (bookImage == null) {
            return;
        }

        String storedName = extractStoredName(bookImage.getFileUrl());

        try {
            if (storedName != null) {
                Files.deleteIfExists(resolveStorageDirectory().resolve(storedName).normalize());
            }
        } catch (IOException ignored) {
        }
    }

    public Resource loadFile(String fileName) {
        try {
            Path filePath = resolveStorageDirectory().resolve(fileName).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists()) {
                throw new ResourceNotFoundException("Khong tim thay file.");
            }

            return resource;
        } catch (MalformedURLException exception) {
            throw new ResourceNotFoundException("Khong tim thay file.");
        }
    }

    private Path resolveStorageDirectory() {
        String uploadDir = mediaStorageProperties.getUploadDir();

        if (uploadDir == null || uploadDir.isBlank()) {
            throw new BadRequestException("Chua cau hinh duong dan luu media trong application.yaml.");
        }

        return Paths.get(uploadDir);
    }

    private String resolveExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        if (lastDot < 0 || lastDot == filename.length() - 1) {
            throw new BadRequestException("File khong co phan mo rong hop le.");
        }

        return filename.substring(lastDot + 1).toLowerCase(Locale.ROOT);
    }

    private String extractStoredName(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return null;
        }

        int lastSlash = fileUrl.lastIndexOf('/');
        return lastSlash >= 0 ? fileUrl.substring(lastSlash + 1) : fileUrl;
    }

    private MediaAssetResponseDTO toResponse(BookImage bookImage) {
        String storedName = extractStoredName(bookImage.getFileUrl());
        return MediaAssetResponseDTO.builder()
                .id(bookImage.getId())
                .bookId(bookImage.getBook().getId())
                .bookTitle(bookImage.getBook().getTitle())
                .fileName(storedName)
                .fileUrl(bookImage.getFileUrl())
                .assetType(resolveExtension(storedName == null ? "unknown.bin" : storedName))
                .primary(Boolean.TRUE.equals(bookImage.getPrimary()))
                .createdAt(bookImage.getCreatedAt())
                .build();
    }
}
