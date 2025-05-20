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
        new transports.Console({ format: combine(colorize(), timestamp(), logFormat) }),
        new transports.File({ filename: "logs/error.log", level: "error" }),
        new transports.File({ filename: "logs/combined.log" })
    ],
    exceptionHandlers: [
        new transports.File({ filename: "logs/exceptions.log" })
    ]
});

module.exports = logger;
