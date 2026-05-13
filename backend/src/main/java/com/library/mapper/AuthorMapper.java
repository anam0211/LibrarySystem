package com.library.mapper;

import java.util.List;

import org.springframework.stereotype.Component;

import com.library.dto.request.AuthorRequestDTO;
import com.library.dto.response.AuthorResponseDTO;
import com.library.entity.Author;

@Component
public class AuthorMapper {
    public Author toEntity(AuthorRequestDTO dto) {
        if (dto == null) {
            return null;
        }

        Author author = new Author();
        author.setName(dto.getName());
        author.setBio(dto.getBio());
        return author;
    }

    public AuthorResponseDTO toResponseDto(Author author) {
        if (author == null) {
            return null;
        }

        return AuthorResponseDTO.builder()
                .id(author.getId())
                .name(author.getName())
                .bio(author.getBio())
                .createdAt(author.getCreatedAt())
                .build();
    }

    public List<AuthorResponseDTO> toResponseDtoList(List<Author> authors) {
        if (authors == null) {
            return List.of();
        }

        return authors.stream().map(this::toResponseDto).toList();
    }
}
