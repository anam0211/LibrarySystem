package com.library.module.author.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;


import com.library.common.exception.AppException;
import com.library.module.author.dto.request.AuthorRequestDTO;
import com.library.module.author.dto.response.AuthorResponseDTO;
import com.library.module.author.entity.Author;
import com.library.module.author.exception.AuthorErrorCode;
import com.library.module.author.mapper.AuthorMapper;
import com.library.module.author.repository.AuthorRepository;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Transactional
public class AuthorService {
    AuthorRepository authorRepository;
    AuthorMapper authorMapper;
    public List<AuthorResponseDTO> findAll(){
        List<Author> author= new ArrayList<>();
        author= authorRepository.findAll();
        return authorMapper.toResponseDtoList(author);
    }
    public AuthorResponseDTO findById(Integer id){
        Author author= authorRepository.findById(id).orElseThrow(() -> new AppException(AuthorErrorCode.AUTHOR_NOT_FOUND));
        return authorMapper.toResponseDto(author);
    }
    public AuthorResponseDTO createAuthor(AuthorRequestDTO authorRequestDTO){
        Author authorCreate= authorRepository.save(authorMapper.toEntity(authorRequestDTO));
        return authorMapper.toResponseDto(authorCreate);
    }
    public AuthorResponseDTO updateAuthor(Integer id, AuthorRequestDTO authorRequestDTO){
        Author author= authorRepository.findById(id).orElseThrow(()-> new AppException(AuthorErrorCode.AUTHOR_NOT_FOUND));
        author.setName(authorRequestDTO.getName());
        author.setBio(authorRequestDTO.getBio());
        Author authorUpdate= authorRepository.save(author);
        return authorMapper.toResponseDto(authorUpdate);
    }

    public void deleteAuthor(Integer id){
        Author author= authorRepository.findById(id).orElseThrow(()-> new AppException(AuthorErrorCode.AUTHOR_NOT_FOUND));
        authorRepository.delete(author);
    }

}
