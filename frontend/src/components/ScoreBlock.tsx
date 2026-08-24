import Box from "@mui/material/Box";
import { useScoreColor } from "@/utils/useScoreColor";

interface Props {
  score: number;
  // 方塊字級；其餘尺寸（寬、高、圓角）皆以 em 相對於此值換算。
  // 傳數字視為 px；傳字串可用任意 CSS 長度（clamp()/rem/em…）。
  // 預設隨視窗高度縮放並設上下限，避免小螢幕把記分鍵盤擠出畫面。
  size?: number | string;
}

const DEFAULT_SIZE = "clamp(0.85rem, 2.6vh, 1.25rem)";

// 單箭分數方塊：微圓角長方形，X(11)/M(0) 以字母表示。
export default function ScoreBlock({ score, size = DEFAULT_SIZE }: Props) {
  const scoreColor = useScoreColor(score);
  let text: string = score.toString();

  if (score === 0) {
    text = "M";
  } else if (score === 11) {
    text = "X";
  }

  return (
    <Box
      className="score_block"
      sx={{
        fontSize: typeof size === "number" ? `${size}px` : size,
        width: "1.85em",
        height: "1.3em",
        borderRadius: "0.26em",
        backgroundColor: scoreColor.backgroundColor,
        color: scoreColor.textColor,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontWeight: 600,
        lineHeight: 1,
        textAlign: "center",
        flexShrink: 0,
      }}
    >
      {/* 數字視覺重心偏上，故整體下移一點；transform 不影響版面。 */}
      <Box component="span" sx={{ transform: "translateY(0.06em)" }}>
        {text}
      </Box>
    </Box>
  );
}
