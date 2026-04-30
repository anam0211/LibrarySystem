package com.library.mapper;

import java.util.List;

import org.mapstruct.Mapper;

import com.library.dto.request.AuthorRequestDTO;
import com.library.dto.response.AuthorResponseDTO;
import com.library.entity.Author;

@Mapper(componentModel = "spring")
public interface AuthorMapper {
    Author toEntity(AuthorRequestDTO dto);
    AuthorResponseDTO toResponseDto(Author author);
    List<AuthorResponseDTO> toResponseDtoList(List<Author> authors);
}
