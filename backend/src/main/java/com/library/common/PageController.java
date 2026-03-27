package com.library.common; // Giữ nguyên package của bạn

import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class PageController implements ErrorController {

    // XỬ LÝ CÁC TRANG BÌNH THƯỜNG (Welcome, Login, Dashboard...)
    @GetMapping("/{page:[^.]+}")
    public String forwardToHtml(@PathVariable String page) {
        if (page.equals("api") || page.equals("error")) {
            return null; 
        }
        return "forward:/" + page + ".html";
    }

    // XỬ LÝ CỔNG CHÍNH (localhost:8080/)
    @GetMapping("/")
    public String redirectToWelcome() {
        return "redirect:/welcome"; 
    }

    // XỬ LÝ LỖI
    @RequestMapping("/error")
    public String handleError() {
        return "forward:/error.html";
    }
}