package com.kh.pinpal2.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.validator.constraints.Length;

@Getter
@Setter
@NoArgsConstructor
public class SignUpReqDto {

    @NotBlank
    @Length(max = 5)
    private String name;
    @NotBlank
    @Length(max = 30)
    private String email;
    @NotBlank
    @Length(max = 8)
    private String birth;
    @NotNull
    private int gender;
    private String snsId;
    @NotBlank
    private String joinPath;
    private String profileImageUrl;
}
