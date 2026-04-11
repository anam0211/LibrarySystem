package com.library.module.media.controller;

import com.library.common.response.ApiResponse;
import com.library.module.media.dto.MediaAssetResponseDTO;
import com.library.module.media.service.MediaService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class MediaController {
    MediaService mediaService;

    @GetMapping
    public ApiResponse<List<MediaAssetResponseDTO>> getAll() {
        return ApiResponse.success(mediaService.getAll());
    }

    @GetMapping("/books/{bookId}")
    public ApiResponse<List<MediaAssetResponseDTO>> getByBook(@PathVariable Integer bookId) {
        return ApiResponse.success(mediaService.getByBook(bookId));
    }

    @PostMapping(value = "/books/{bookId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<MediaAssetResponseDTO> upload(
            @PathVariable Integer bookId,
            @RequestPart("file") MultipartFile file,
            @RequestParam(defaultValue = "false") Boolean primary
    ) {
        return ApiResponse.success(mediaService.upload(bookId, file, primary));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Integer id) {
        mediaService.delete(id);
        return ApiResponse.success(null);
    }

    @GetMapping("/files/{fileName:.+}")
    public ResponseEntity<Resource> getFile(@PathVariable String fileName) {
        Resource resource = mediaService.loadFile(fileName);
        MediaType contentType = MediaTypeFactory.getMediaType(fileName)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);

        return ResponseEntity.ok()
                .contentType(contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }
}
