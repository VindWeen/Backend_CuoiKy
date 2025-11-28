using log4net;
using System;

namespace LearnApiNetCore.Helpers
{
    public static class LogHelper
    {
        private static readonly ILog log = LogManager.GetLogger(typeof(LogHelper));
        // Ghi log thông tin
        public static void Info(string message)
        {
            log.Info(message);
        }
        // Ghi log lỗi với thông tin ngoại lệ
        public static void LogException(Exception ex, string where = "")
        {
            log.Error($"Lỗi xảy ra tại: {where}\nMessage: {ex.Message}\nStackTrace: {ex.StackTrace}");
        }
    }
}
