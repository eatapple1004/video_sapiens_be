// utils/logger.js
const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, colorize } = format;

// 로그 메시지 포맷 정의
const logFormat = printf(({ level, message, timestamp }) => {
    return `[${timestamp}] [${level.toUpperCase()}] ${message}`;
});

// Logger 인스턴스 생성
const logger = createLogger({
    level: "info", // 최소 로그 레벨: info 이상만 출력됨
    format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        logFormat
    ),
    transports: [
        new transports.Console({
            format: combine(
                timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
                //colorize({ level : true }),       // ✅ 컬러 적용을 전부에 명시적으로 적용
                logFormat                      // ✅ 포맷은 마지막에 적용
            )
        }),
        new transports.File({ filename: "logs/error.log", level: "error" }),
        new transports.File({ filename: "logs/combined.log" })
    ],
    exceptionHandlers: [
        new transports.File({ filename: "logs/exceptions.log" })
    ]
});

module.exports = logger;
