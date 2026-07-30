// 时间格式化：将 ISO 格式的 T 分隔符替换为空格
export const formatTime = (time) => {
  if (!time) return '-'
  return time.replace('T', ' ').slice(0, 19)
}
