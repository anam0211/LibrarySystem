package com.library.service;

import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.library.common.exception.BadRequestException;
import com.library.common.exception.ResourceNotFoundException;
import com.library.config.MediaStorageProperties;
import com.library.dto.request.UserKycRequestDTO;
import com.library.dto.response.PendingKycUserResponseDTO;
import com.library.dto.response.UserKycResponseDTO;
import com.library.entity.User;
import com.library.entity.UserAddress;
import com.library.entity.VerificationStatus;
import com.library.repository.UserAddressRepository;
import com.library.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@Transactional
@RequiredArgsConstructor
public class UserKycService {

    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
    private static final String INTERNAL_MEDIA_PREFIX = "/library/api/media/files/";
    private static final Pattern DATA_URI_PATTERN = Pattern.compile("^data:(.+?);base64,(.+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern DATA_URI_WITHOUT_MIME_PATTERN = Pattern.compile("^data:;base64,(.+)$", Pattern.CASE_INSENSITIVE);
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$", Pattern.CASE_INSENSITIVE);
    private static final Pattern PHONE_PATTERN = Pattern.compile("^[0-9+()\\-\\s]{8,30}$");
    private static final Map<String, String> MIME_EXTENSION_MAP = Map.of(
            "image/jpeg", "jpg",
            "image/jpg", "jpg",
            "image/png", "png",
            "image/webp", "webp"
    );

    private final UserRepository userRepository;
    private final UserAddressRepository userAddressRepository;
    private final MediaStorageProperties mediaStorageProperties;

    @Transactional(readOnly = true)
    public UserKycResponseDTO getMyKyc(String userEmail) {
        return toKycResponse(findUserByEmail(userEmail));
    }

    public UserKycResponseDTO submitMyKyc(String userEmail, UserKycRequestDTO request) {
        User user = findUserByEmail(userEmail);
        if (user.getVerificationStatus() == VerificationStatus.VERIFIED) {
            throw new BadRequestException("Hồ sơ đã được xác thực, bạn đọc không thể chỉnh sửa thông tin.");
        }

        String previousImageUrl = user.getIdCardImageUrl();
        String submittedEmail = resolveSubmittedEmail(user, request);
        String submittedPhone = resolveSubmittedPhone(user, request);
        String submittedAddress = resolveSubmittedAddress(user, request);
        String imageUrl = resolveImageUrl(user, request);

        if (normalize(imageUrl) == null) {
            throw new BadRequestException("Ảnh CCCD là bắt buộc.");
        }

        if (!Objects.equals(previousImageUrl, imageUrl)) {
            deleteManagedKycFile(previousImageUrl);
        }

        user.setVerificationEmail(submittedEmail);
        user.setVerificationPhone(submittedPhone);
        user.setVerificationAddress(submittedAddress);
        user.setIdCardNumber(resolveIdCardNumber(user, request));
        user.setIdCardImageUrl(imageUrl);
        user.setVerificationStatus(VerificationStatus.PENDING);

        return toKycResponse(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<PendingKycUserResponseDTO> getKycUsers() {
        return userRepository.findAll(Sort.by(Sort.Direction.DESC, "updatedAt", "createdAt"))
                .stream()
                .map(this::toPendingResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<PendingKycUserResponseDTO> getPendingKycUsers() {
        return userRepository.findByVerificationStatusOrderByCreatedAtAsc(VerificationStatus.PENDING)
                .stream()
                .map(this::toPendingResponse)
                .toList();
    }

    public UserKycResponseDTO approveKyc(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));

        if (user.getVerificationStatus() != VerificationStatus.PENDING) {
            throw new BadRequestException("Chi co the duyet tai khoan dang o trang thai PENDING.");
        }

        if (normalize(user.getIdCardImageUrl()) == null) {
            throw new BadRequestException("Nguoi dung chua gui anh CCCD.");
        }

        user.setVerificationStatus(VerificationStatus.VERIFIED);
        return toKycResponse(userRepository.save(user));
    }

    public UserKycResponseDTO rejectKyc(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));

        if (user.getVerificationStatus() == VerificationStatus.UNVERIFIED) {
            throw new BadRequestException("Ho so nay chua duoc gui xac thuc.");
        }

        user.setVerificationStatus(VerificationStatus.UNVERIFIED);
        return toKycResponse(userRepository.save(user));
    }

    private String resolveImageUrl(User user, UserKycRequestDTO request) {
        if (request == null) {
            throw new BadRequestException("Du lieu KYC khong duoc de trong.");
        }

        String imageBase64 = normalize(request.getIdCardImageBase64());
        String imageUrl = normalize(request.getIdCardImageUrl());

        if (imageBase64 != null && imageUrl != null) {
            throw new BadRequestException("Chi duoc gui mot trong hai truong: idCardImageBase64 hoac idCardImageUrl.");
        }

        if (imageUrl != null) {
            return validateImageUrl(imageUrl);
        }

        if (imageBase64 != null) {
            return storeBase64Image(imageBase64);
        }

        return normalize(user.getIdCardImageUrl());
    }

    private String validateImageUrl(String imageUrl) {
        if (imageUrl.startsWith("/")) {
            return imageUrl;
        }

        try {
            URI uri = new URI(imageUrl);
            if (uri.getScheme() == null) {
                throw new BadRequestException("idCardImageUrl phai la link hop le.");
            }

            String scheme = uri.getScheme().toLowerCase();
            if (!scheme.equals("http") && !scheme.equals("https")) {
                throw new BadRequestException("idCardImageUrl chi ho tro http, https hoac duong dan noi bo.");
            }

            return imageUrl;
        } catch (URISyntaxException exception) {
            throw new BadRequestException("idCardImageUrl phai la link hop le.");
        }
    }

    private String storeBase64Image(String rawValue) {
        String mimeType = "image/png";
        String payload = rawValue;

        Matcher matcher = DATA_URI_PATTERN.matcher(rawValue);
        if (matcher.matches()) {
            mimeType = matcher.group(1).toLowerCase();
            payload = matcher.group(2);
        } else {
            Matcher emptyMimeMatcher = DATA_URI_WITHOUT_MIME_PATTERN.matcher(rawValue);
            if (emptyMimeMatcher.matches()) {
                payload = emptyMimeMatcher.group(1);
            }
        }

        String extension = MIME_EXTENSION_MAP.get(mimeType);
        if (extension == null) {
            throw new BadRequestException("Chi ho tro anh CCCD dang jpeg, png hoac webp.");
        }

        byte[] content;
        try {
            content = Base64.getMimeDecoder().decode(payload);
        } catch (IllegalArgumentException exception) {
            throw new BadRequestException("Chuoi idCardImageBase64 khong hop le.");
        }

        if (content.length == 0) {
            throw new BadRequestException("Anh CCCD khong duoc de trong.");
        }
        if (content.length > MAX_FILE_SIZE) {
            throw new BadRequestException("Anh CCCD vuot qua gioi han 10MB.");
        }

        try {
            Path directory = resolveStorageDirectory();
            Files.createDirectories(directory);

            String filename = "kyc-" + UUID.randomUUID() + "." + extension;
            Path targetPath = directory.resolve(filename).normalize();
            Files.write(targetPath, content);
            return INTERNAL_MEDIA_PREFIX + filename;
        } catch (IOException exception) {
            throw new BadRequestException("Khong the luu anh CCCD.");
        }
    }

    private void deleteManagedKycFile(String existingUrl) {
        String normalizedUrl = normalize(existingUrl);
        if (normalizedUrl == null || !normalizedUrl.startsWith(INTERNAL_MEDIA_PREFIX + "kyc-")) {
            return;
        }

        String filename = normalizedUrl.substring(INTERNAL_MEDIA_PREFIX.length());
        try {
            Files.deleteIfExists(resolveStorageDirectory().resolve(filename).normalize());
        } catch (IOException ignored) {
        }
    }

    private Path resolveStorageDirectory() {
        String uploadDir = normalize(mediaStorageProperties.getUploadDir());
        if (uploadDir == null) {
            throw new BadRequestException("Chua cau hinh duong dan luu media.");
        }
        return Paths.get(uploadDir);
    }

    private UserKycResponseDTO toKycResponse(User user) {
        boolean canEdit = user.getVerificationStatus() != VerificationStatus.VERIFIED;

        return UserKycResponseDTO.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .accountEmail(user.getEmail())
                .email(resolveDisplayEmail(user))
                .phone(resolveDisplayPhone(user))
                .address(resolveDisplayAddress(user))
                .idCardNumber(normalize(user.getIdCardNumber()))
                .verificationStatus(user.getVerificationStatus().name())
                .idCardImageUrl(user.getIdCardImageUrl())
                .canEdit(canEdit)
                .canResubmit(canEdit)
                .adminApprovalEnabled(true)
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private PendingKycUserResponseDTO toPendingResponse(User user) {
        return PendingKycUserResponseDTO.builder()
                .userId(user.getId())
                .fullName(user.getFullName())
                .accountEmail(user.getEmail())
                .email(resolveDisplayEmail(user))
                .phone(resolveDisplayPhone(user))
                .address(resolveDisplayAddress(user))
                .idCardNumber(normalize(user.getIdCardNumber()))
                .verificationStatus(user.getVerificationStatus().name())
                .idCardImageUrl(user.getIdCardImageUrl())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }

    private User findUserByEmail(String userEmail) {
        return userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay nguoi dung."));
    }

    private String resolveSubmittedEmail(User user, UserKycRequestDTO request) {
        String email = firstNonBlank(
                normalize(request != null ? request.getEmail() : null),
                normalize(user.getVerificationEmail()),
                normalize(user.getEmail())
        );

        if (email == null) {
            throw new BadRequestException("Email xac thuc khong duoc de trong.");
        }
        if (email.length() > 255 || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new BadRequestException("Email xac thuc khong hop le.");
        }

        return email;
    }

    private String resolveSubmittedPhone(User user, UserKycRequestDTO request) {
        String phone = firstNonBlank(
                normalize(request != null ? request.getPhone() : null),
                normalize(user.getVerificationPhone()),
                normalize(user.getPhone())
        );

        if (phone == null) {
            throw new BadRequestException("So dien thoai xac thuc khong duoc de trong.");
        }
        if (!PHONE_PATTERN.matcher(phone).matches()) {
            throw new BadRequestException("So dien thoai xac thuc khong hop le.");
        }

        return phone;
    }

    private String resolveSubmittedAddress(User user, UserKycRequestDTO request) {
        String address = firstNonBlank(
                normalize(request != null ? request.getAddress() : null),
                normalize(user.getVerificationAddress()),
                resolveFallbackAddress(user.getId())
        );

        if (address == null) {
            throw new BadRequestException("Dia chi xac thuc khong duoc de trong.");
        }
        if (address.length() > 500) {
            throw new BadRequestException("Dia chi xac thuc khong duoc vuot qua 500 ky tu.");
        }

        return address;
    }

    private String resolveIdCardNumber(User user, UserKycRequestDTO request) {
        String idCardNumber = firstNonBlank(
                normalize(request != null ? request.getIdCardNumber() : null),
                normalize(user.getIdCardNumber())
        );

        if (idCardNumber != null && idCardNumber.length() > 30) {
            throw new BadRequestException("So CCCD khong duoc vuot qua 30 ky tu.");
        }

        return idCardNumber;
    }

    private String resolveDisplayEmail(User user) {
        return firstNonBlank(normalize(user.getVerificationEmail()), normalize(user.getEmail()));
    }

    private String resolveDisplayPhone(User user) {
        return firstNonBlank(normalize(user.getVerificationPhone()), normalize(user.getPhone()));
    }

    private String resolveDisplayAddress(User user) {
        return firstNonBlank(normalize(user.getVerificationAddress()), resolveFallbackAddress(user.getId()));
    }

    private String resolveFallbackAddress(Integer userId) {
        return userAddressRepository.findByUser_IdAndDefaultAddressTrue(userId)
                .map(UserAddress::getAddressLine)
                .map(this::normalize)
                .orElseGet(() -> userAddressRepository.findByUser_IdOrderByDefaultAddressDescIdDesc(userId).stream()
                        .findFirst()
                        .map(UserAddress::getAddressLine)
                        .map(this::normalize)
                        .orElse(null));
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
