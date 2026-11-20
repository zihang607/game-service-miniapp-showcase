package com.gameservice.backend.controller;

import com.gameservice.backend.common.api.ApiResponse;
import com.gameservice.backend.common.exception.BusinessException;
import com.gameservice.backend.service.CatalogReadService;
import com.gameservice.backend.vo.ReadVo;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class CatalogReadController {
    private final CatalogReadService service;
    public CatalogReadController(CatalogReadService service) { this.service = service; }

    @GetMapping("/games")
    public ApiResponse<List<ReadVo.Game>> games() { return ApiResponse.success(service.games()); }

    @GetMapping("/service-categories")
    public ApiResponse<List<ReadVo.Category>> categories() { return ApiResponse.success(service.categories()); }

    @GetMapping("/services")
    public ApiResponse<List<ReadVo.ServiceSummary>> services(
            @RequestParam(required = false) String categoryId,
            @RequestParam(required = false) String keyword) {
        Long parsed = categoryId == null || categoryId.isBlank() ? null : parseId(categoryId);
        return ApiResponse.success(service.services(parsed, keyword));
    }

    @GetMapping("/services/{id}")
    public ApiResponse<ReadVo.ServiceDetail> detail(@PathVariable String id) {
        return ApiResponse.success(service.detail(parseId(id)));
    }

    static long parseId(String value) {
        try {
            long id = Long.parseLong(value);
            if (id > 0) return id;
        } catch (NumberFormatException ignored) { }
        throw new BusinessException(40001, HttpStatus.BAD_REQUEST, "ID 参数错误");
    }
}
