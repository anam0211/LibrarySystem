package com.library.module.publisher.service;

import com.library.common.exception.AppException;
import com.library.module.book.repository.BookRepository;
import com.library.module.publisher.dto.request.PublisherRequestDTO;
import com.library.module.publisher.dto.response.PublisherResponseDTO;
import com.library.module.publisher.entity.Publisher;
import com.library.module.publisher.exception.PublisherErrorCode;
import com.library.module.publisher.repository.PublisherRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PublisherService {
    PublisherRepository publisherRepository;
    BookRepository bookRepository;

    public List<PublisherResponseDTO> findAll() {
        return publisherRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    public PublisherResponseDTO findById(Integer id) {
        return toResponse(getPublisher(id));
    }

    public PublisherResponseDTO create(PublisherRequestDTO requestDTO) {
        String normalizedName = normalizeName(requestDTO.getName());
        Publisher publisher = new Publisher();
        publisher.setName(normalizedName);
        publisher.setCreatedAt(LocalDateTime.now());

        return toResponse(publisherRepository.save(publisher));
    }

    public PublisherResponseDTO update(Integer id, PublisherRequestDTO requestDTO) {
        Publisher publisher = getPublisher(id);
        publisher.setName(normalizeName(requestDTO.getName()));

        return toResponse(publisherRepository.save(publisher));
    }

    public void delete(Integer id) {
        Publisher publisher = getPublisher(id);

        if (bookRepository.countByPublisher_Id(id) > 0) {
            throw new AppException(PublisherErrorCode.PUBLISHER_LINKED_BOOK);
        }

        publisherRepository.delete(publisher);
    }

    private Publisher getPublisher(Integer id) {
        return publisherRepository.findById(id)
                .orElseThrow(() -> new AppException(PublisherErrorCode.PUBLISHER_NOT_FOUND));
    }

    private String normalizeName(String name) {
        String normalizedName = name == null ? "" : name.trim();

        if (normalizedName.isEmpty()) {
            throw new AppException(PublisherErrorCode.PUBLISHER_NAME_REQUIRED);
        }

        return normalizedName;
    }

    private PublisherResponseDTO toResponse(Publisher publisher) {
        return PublisherResponseDTO.builder()
                .id(publisher.getId())
                .name(publisher.getName())
                .createdAt(publisher.getCreatedAt())
                .bookCount(bookRepository.countByPublisher_Id(publisher.getId()))
                .build();
    }
}
