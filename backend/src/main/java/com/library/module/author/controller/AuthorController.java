package com.library.module.author.controller;

import com.library.common.response.ApiResponse;
import com.library.module.author.dto.request.AuthorRequestDTO;
import com.library.module.author.dto.response.AuthorResponseDTO;
import com.library.module.author.service.AuthorService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

import org.springframework.web.bind.annotation.*;

import java.util.List;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.PathVariable;


@RestController
@RequestMapping("/api/authors")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthorController {
    AuthorService authorService;


    @GetMapping
    public ApiResponse<List<AuthorResponseDTO>> getAll() {
        return ApiResponse.success(authorService.findAll());
    }

    @GetMapping("/{id}")
    public ApiResponse<AuthorResponseDTO> getById(@PathVariable Integer id) {
        return ApiResponse.success(authorService.findById(id));
    }

    @PutMapping("/{id}")
    public ApiResponse<AuthorResponseDTO> updateAuthor (@PathVariable Integer id, @RequestBody AuthorRequestDTO authorRequestDTO) {
       
        return ApiResponse.success(authorService.updateAuthor(id, authorRequestDTO));
    }

    @PostMapping
    public ApiResponse<AuthorResponseDTO> createAuthor(@RequestBody AuthorRequestDTO authorRequestDTO) {
        return ApiResponse.success(authorService.createAuthor(authorRequestDTO));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteAuthor(@PathVariable Integer id){
        authorService.deleteAuthor(id);
        return ApiResponse.success(null);
    }
}