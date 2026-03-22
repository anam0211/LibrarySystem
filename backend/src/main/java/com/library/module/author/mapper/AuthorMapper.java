package com.library.module.author.mapper;

import java.util.List;

import org.mapstruct.Mapper;

import com.library.module.author.dto.request.AuthorRequestDTO;
import com.library.module.author.dto.response.AuthorResponseDTO;
import com.library.module.author.entity.Author;

@Mapper(componentModel = "spring")
public interface AuthorMapper {
    Author toEntity(AuthorRequestDTO dto);
    AuthorResponseDTO toResponseDto(Author author);
    List<AuthorResponseDTO> toResponseDtoList(List<Author> authors);
}
