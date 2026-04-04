package com.library.common; 

import org.springframework.boot.webmvc.error.ErrorController;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class PageController implements ErrorController {

    // Regex: Khớp mọi chuỗi không có dấu chấm, VÀ không bắt đầu bằng "api" hoặc "error"
    @GetMapping("/{page:^(?!api|error)[^.]+}")
    public String forwardToHtml(@PathVariable String page) {
        return "forward:/" + page + ".html";
    }

    @GetMapping("/")
    public String redirectToWelcome() {
        return "redirect:/dashboard"; 
    }

    @RequestMapping("/error")
    public String handleError() {
        return "forward:/error.html";
    }
}