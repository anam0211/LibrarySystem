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
import com.library.module.book.repository.BookAuthorRepository;
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
    BookAuthorRepository bookAuthorRepository;
    public List<AuthorResponseDTO> findAll(){
        List<Author> author= new ArrayList<>();
        author= authorRepository.findAll();
        return author.stream().map(this::toResponse).toList();
    }
    public AuthorResponseDTO findById(Integer id){
        Author author= authorRepository.findById(id).orElseThrow(() -> new AppException(AuthorErrorCode.AUTHOR_NOT_FOUND));
        return toResponse(author);
    }
    public AuthorResponseDTO createAuthor(AuthorRequestDTO authorRequestDTO){
        Author authorCreate= authorRepository.save(authorMapper.toEntity(authorRequestDTO));
        return toResponse(authorCreate);
    }
    public AuthorResponseDTO updateAuthor(Integer id, AuthorRequestDTO authorRequestDTO){
        Author author= authorRepository.findById(id).orElseThrow(()-> new AppException(AuthorErrorCode.AUTHOR_NOT_FOUND));
        author.setName(authorRequestDTO.getName());
        author.setBio(authorRequestDTO.getBio());
        Author authorUpdate= authorRepository.save(author);
        return toResponse(authorUpdate);
    }

    public void deleteAuthor(Integer id){
        Author author= authorRepository.findById(id).orElseThrow(()-> new AppException(AuthorErrorCode.AUTHOR_NOT_FOUND));

        if (bookAuthorRepository.countByAuthor_Id(id) > 0) {
            throw new AppException(AuthorErrorCode.AUTHOR_LINKED_BOOK);
        }

        authorRepository.delete(author);
    }

    private AuthorResponseDTO toResponse(Author author) {
        AuthorResponseDTO responseDTO = authorMapper.toResponseDto(author);
        responseDTO.setBookCount(bookAuthorRepository.countByAuthor_Id(author.getId()));
        return responseDTO;
    }

}
