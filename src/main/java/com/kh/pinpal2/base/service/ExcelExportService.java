package com.kh.pinpal2.base.service;

import com.kh.pinpal2.scoreboard.dto.ScoreboardMemberRow;
import com.kh.pinpal2.scoreboard.repository.ScoreboardRepository;
import lombok.RequiredArgsConstructor;
import org.apache.poi.hssf.usermodel.HSSFWorkbook;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExcelExportService {

    private final ScoreboardRepository scoreboardRepository;

    public byte[] exportScoreboardToExcel(Long gameId) {
        List<ScoreboardMemberRow> scoreboards = scoreboardRepository.findAllWithMemberMetaByGameId(gameId);

        Workbook workbook = new XSSFWorkbook();
        Sheet sheet = workbook.createSheet("Scoreboard");

        // 스타일 생성
        CellStyle titleStyle = createTitleStyle(workbook);
        CellStyle headerStyle = createHeaderStyle(workbook);
        CellStyle dataStyle = createDataStyle(workbook);
        CellStyle numberStyle = createNumberStyle(workbook);
        CellStyle decimalStyle = createDecimalStyle(workbook);
        CellStyle centerStyle = createCenterStyle(workbook);
        CellStyle grade1Style = createGradeStyle(workbook, IndexedColors.LIGHT_TURQUOISE1);
        CellStyle grade2Style = createGradeStyle(workbook, IndexedColors.LIGHT_GREEN);
        CellStyle grade3Style = createGradeStyle(workbook, IndexedColors.LIGHT_YELLOW);
        CellStyle grade4Style = createGradeStyle(workbook, IndexedColors.LIGHT_ORANGE);
        CellStyle grade5Style = createGradeStyle(workbook, IndexedColors.LIGHT_TURQUOISE);
        CellStyle grade6Style = createGradeStyle(workbook, IndexedColors.LIGHT_CORNFLOWER_BLUE);
        CellStyle highScoreStyle = createHighScoreStyle(workbook);
        CellStyle highTotalStyle = createHighTotalStyle(workbook);
        CellStyle positiveDeviationStyle = createPositiveDeviationStyle(workbook);
        CellStyle negativeDeviationStyle = createNegativeDeviationStyle(workbook);

        // 게임 이름을 대문처럼 표시 (1행)
        Row titleRow = sheet.createRow(0);
        Cell titleCell = titleRow.createCell(0);
        titleCell.setCellValue(scoreboards.get(0).gameName());
        titleCell.setCellStyle(titleStyle);
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 12)); // 1행을 13열로 병합

        String[] headers = {"순위", "군", "이름", "에버", "1G", "2G", "3G", "4G", "총점", "평균", "에버편차", "HIGH", "LOW"};
        
        // 헤더 행 생성 및 스타일 적용 (2행)
        Row headerRow = sheet.createRow(1);
        for (int i = 0; i < headers.length; i++) {
            Cell cell = headerRow.createCell(i);
            cell.setCellValue(headers[i]);
            cell.setCellStyle(headerStyle);
        }

        // 총점 기준으로 정렬
        List<ScoreboardMemberRow> sortedScoreboards = scoreboards.stream()
            .sorted((a, b) -> {
                int totalScoreA = a.game1() + a.game2() + a.game3() + a.game4();
                int totalScoreB = b.game1() + b.game2() + b.game3() + b.game4();
                return Integer.compare(totalScoreB, totalScoreA); // 내림차순 정렬 (높은 점수 순)
            })
            .toList();

        // 데이터 행 생성 및 스타일 적용
        int rowNum = 2;
        for (ScoreboardMemberRow scoreboardMemberRow : sortedScoreboards) {
            Row row = sheet.createRow(rowNum++);
            
            // 군별 스타일 선택
            CellStyle gradeStyle = getGradeStyle(scoreboardMemberRow.grade(), grade1Style, grade2Style, grade3Style, grade4Style, grade5Style, grade6Style);
            
            // 순위 (가운데 정렬)
            Cell rankCell = row.createCell(0);
            rankCell.setCellValue(rowNum - 2);
            rankCell.setCellStyle(centerStyle);
            
            // 군 (군별 색상 적용)
            Cell gradeCell = row.createCell(1);
            gradeCell.setCellValue(scoreboardMemberRow.grade());
            gradeCell.setCellStyle(gradeStyle);
            
            // 이름 (군별 색상 적용)
            Cell nameCell = row.createCell(2);
            nameCell.setCellValue(scoreboardMemberRow.memberName());
            nameCell.setCellStyle(gradeStyle);
            
            // 에버 (숫자 스타일, 가운데 정렬)
            Cell avgCell = row.createCell(3);
            avgCell.setCellValue(scoreboardMemberRow.memberAvg());
            avgCell.setCellStyle(numberStyle);
            
            // 게임 점수들 (200점 이상이면 빨간색)
            Cell game1Cell = row.createCell(4);
            game1Cell.setCellValue(scoreboardMemberRow.game1());
            game1Cell.setCellStyle(scoreboardMemberRow.game1() >= 200 ? highScoreStyle : numberStyle);
            
            Cell game2Cell = row.createCell(5);
            game2Cell.setCellValue(scoreboardMemberRow.game2());
            game2Cell.setCellStyle(scoreboardMemberRow.game2() >= 200 ? highScoreStyle : numberStyle);
            
            Cell game3Cell = row.createCell(6);
            game3Cell.setCellValue(scoreboardMemberRow.game3());
            game3Cell.setCellStyle(scoreboardMemberRow.game3() >= 200 ? highScoreStyle : numberStyle);
            
            Cell game4Cell = row.createCell(7);
            game4Cell.setCellValue(scoreboardMemberRow.game4());
            game4Cell.setCellStyle(scoreboardMemberRow.game4() >= 200 ? highScoreStyle : numberStyle);
            
            // 총점 (800점 이상이면 빨간색)
            int totalScore = scoreboardMemberRow.game1() + scoreboardMemberRow.game2() + scoreboardMemberRow.game3() + scoreboardMemberRow.game4();
            Cell totalCell = row.createCell(8);
            totalCell.setCellValue(totalScore);
            totalCell.setCellStyle(totalScore >= 800 ? highTotalStyle : numberStyle);
            
            // 평균 (200점 이상이면 빨간색, 소수점 표시)
            double avgScore = (double) totalScore / 4;
            Cell avgScoreCell = row.createCell(9);
            avgScoreCell.setCellValue(avgScore);
            if (avgScore >= 200) {
                // 고득점 스타일을 소수점 형식으로 복사
                CellStyle highScoreDecimalStyle = workbook.createCellStyle();
                highScoreDecimalStyle.cloneStyleFrom(highScoreStyle);
                highScoreDecimalStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.0"));
                avgScoreCell.setCellStyle(highScoreDecimalStyle);
            } else {
                avgScoreCell.setCellStyle(decimalStyle);
            }
            
            // 에버편차 (10점 이상이면 빨간색, 음수면 파란색, 소수점 표시)
            double deviation = avgScore - scoreboardMemberRow.memberAvg();
            Cell deviationCell = row.createCell(10);
            deviationCell.setCellValue(deviation);
            if (deviation >= 10) {
                // 양수 편차 스타일을 소수점 형식으로 복사
                CellStyle positiveDeviationDecimalStyle = workbook.createCellStyle();
                positiveDeviationDecimalStyle.cloneStyleFrom(positiveDeviationStyle);
                positiveDeviationDecimalStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.0"));
                deviationCell.setCellStyle(positiveDeviationDecimalStyle);
            } else if (deviation < 0) {
                // 음수 편차 스타일을 소수점 형식으로 복사
                CellStyle negativeDeviationDecimalStyle = workbook.createCellStyle();
                negativeDeviationDecimalStyle.cloneStyleFrom(negativeDeviationStyle);
                negativeDeviationDecimalStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0.0"));
                deviationCell.setCellStyle(negativeDeviationDecimalStyle);
            } else {
                deviationCell.setCellStyle(decimalStyle);
            }
            
            // HIGH (숫자 스타일, 가운데 정렬)
            int highScore = List.of(scoreboardMemberRow.game1(), scoreboardMemberRow.game2(), scoreboardMemberRow.game3(), scoreboardMemberRow.game4()).stream().max(Integer::compare).get();
            Cell highCell = row.createCell(11);
            highCell.setCellValue(highScore);
            highCell.setCellStyle(highScore >= 200 ? highScoreStyle : numberStyle);
            
            // LOW (숫자 스타일, 가운데 정렬)
            int lowScore = List.of(scoreboardMemberRow.game1(), scoreboardMemberRow.game2(), scoreboardMemberRow.game3(), scoreboardMemberRow.game4()).stream().min(Integer::compare).get();
            Cell lowCell = row.createCell(12);
            lowCell.setCellValue(lowScore);
            lowCell.setCellStyle(numberStyle);
        }

        // 열 너비 자동 조정
        for (int i = 0; i < headers.length; i++) {
            sheet.autoSizeColumn(i);
            // 최소 너비 설정
            if (sheet.getColumnWidth(i) < 2000) {
                sheet.setColumnWidth(i, 2000);
            }
        }

        // 정렬 기능 추가 (각 열에 필터 추가)
        sheet.setAutoFilter(new CellRangeAddress(1, 1, 0, 12));

        ByteArrayOutputStream out = new ByteArrayOutputStream();

        try {
            workbook.write(out);
            workbook.close();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }

        return out.toByteArray();
    }

    // 헤더 스타일 생성
    private CellStyle createHeaderStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        
        // 폰트 설정
        font.setBold(true);
        font.setFontHeightInPoints((short) 11);
        font.setColor(IndexedColors.WHITE.getIndex());
        
        // 배경색 설정 (세련된 네이비)
        style.setFillForegroundColor(IndexedColors.GREY_40_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        // 테두리 설정 (미묘한 테두리)
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        
        // 정렬 설정 (가운데)
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        
        style.setFont(font);
        return style;
    }

    // 데이터 스타일 생성
    private CellStyle createDataStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        
        // 테두리 설정 (미묘한 테두리)
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        
        // 정렬 설정 (가운데)
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        
        return style;
    }

    // 숫자 스타일 생성 (정수)
    private CellStyle createNumberStyle(Workbook workbook) {
        CellStyle style = createDataStyle(workbook);
        style.setDataFormat(workbook.createDataFormat().getFormat("#,##0"));
        return style;
    }

    // 소수점 스타일 생성 (소수점 1자리)
    private CellStyle createDecimalStyle(Workbook workbook) {
        CellStyle style = createDataStyle(workbook);
        style.setDataFormat(workbook.createDataFormat().getFormat("#,##0.0"));
        return style;
    }

    // 가운데 정렬 스타일 생성
    private CellStyle createCenterStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        
        // 테두리 설정 (미묘한 테두리)
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        
        // 정렬 설정 (가운데)
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        
        return style;
    }

    // 제목 스타일 생성
    private CellStyle createTitleStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        
        // 폰트 설정
        font.setBold(true);
        font.setFontHeightInPoints((short) 18);
        font.setColor(IndexedColors.WHITE.getIndex());
        
        // 배경색 설정 (세련된 다크 그레이)
        style.setFillForegroundColor(IndexedColors.GREY_50_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        // 정렬 설정 (가운데)
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        
        style.setFont(font);
        return style;
    }

    // 군별 스타일 생성
    private CellStyle createGradeStyle(Workbook workbook, IndexedColors color) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        
        // 폰트 설정
        font.setBold(false);
        font.setFontHeightInPoints((short) 10);
        font.setColor(IndexedColors.BLACK.getIndex());
        
        // 배경색 설정 (매우 연한 색상)
        style.setFillForegroundColor(color.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        
        // 테두리 설정 (미묘한 테두리)
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        
        // 정렬 설정 (가운데)
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        
        style.setFont(font);
        return style;
    }

    // 고득점 스타일 생성 (세련된 빨간색)
    private CellStyle createHighScoreStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        
        // 폰트 설정
        font.setBold(false);
        font.setColor(IndexedColors.RED.getIndex());
        
        // 테두리 설정 (미묘한 테두리)
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        
        // 정렬 설정 (가운데)
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        
        // 숫자 형식 (정수)
        style.setDataFormat(workbook.createDataFormat().getFormat("#,##0"));
        
        style.setFont(font);
        return style;
    }

        // 고총점 스타일 생성 (세련된 진한 빨간색)
    private CellStyle createHighTotalStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        
        // 폰트 설정
        font.setBold(true);
        font.setColor(IndexedColors.RED.getIndex());
 
        // 테두리 설정 (미묘한 테두리)
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        
        // 정렬 설정 (가운데)
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        
        // 숫자 형식 (정수)
        style.setDataFormat(workbook.createDataFormat().getFormat("#,##0"));
        
        style.setFont(font);
        return style;
    }

    // 양수 편차 스타일 생성 (세련된 빨간색)
    private CellStyle createPositiveDeviationStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        
        // 폰트 설정
        font.setBold(false);
        font.setColor(IndexedColors.RED.getIndex());
        
        // 테두리 설정 (미묘한 테두리)
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        
        // 정렬 설정 (가운데)
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        
        // 숫자 형식
        style.setDataFormat(workbook.createDataFormat().getFormat("#,##0.0"));
        
        style.setFont(font);
        return style;
    }

    // 음수 편차 스타일 생성 (세련된 파란색)
    private CellStyle createNegativeDeviationStyle(Workbook workbook) {
        CellStyle style = workbook.createCellStyle();
        Font font = workbook.createFont();
        
        // 폰트 설정
        font.setBold(false);
        font.setColor(IndexedColors.BLUE.getIndex());
        
        // 테두리 설정 (미묘한 테두리)
        style.setBorderTop(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN);
        style.setBorderLeft(BorderStyle.THIN);
        style.setBorderRight(BorderStyle.THIN);
        
        // 정렬 설정 (가운데)
        style.setAlignment(HorizontalAlignment.CENTER);
        style.setVerticalAlignment(VerticalAlignment.CENTER);
        
        // 숫자 형식
        style.setDataFormat(workbook.createDataFormat().getFormat("#,##0.0"));
        
        style.setFont(font);
        return style;
    }

    // 군별 스타일 선택 메서드
    private CellStyle getGradeStyle(Integer grade, CellStyle grade1Style, CellStyle grade2Style, CellStyle grade3Style, CellStyle grade4Style, CellStyle grade5Style, CellStyle grade6Style) {
        if (grade == null) return grade1Style;
        
        switch (grade) {
            case 1: return grade1Style;
            case 2: return grade2Style;
            case 3: return grade3Style;
            case 4: return grade4Style;
            case 5: return grade5Style;
            case 6: return grade6Style;
            default: return grade1Style;
        }
    }
}
