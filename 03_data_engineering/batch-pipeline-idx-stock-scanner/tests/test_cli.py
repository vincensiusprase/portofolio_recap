import unittest
from unittest.mock import patch

from src import stock_scanner


class ScannerCliTests(unittest.TestCase):
    def test_calculate_swing_strength_tracks_bias_and_trailing_levels(self):
        import pandas as pd

        bars = pd.DataFrame(
            {
                "High": [10, 11, 10, 9, 15, 13, 12, 16, 14],
                "Low": [8, 5, 7, 8, 9, 10, 11, 14, 3],
                "Close": [9, 8, 9, 8.5, 14, 12, 11.5, 16, 4],
            }
        )

        bullish = stock_scanner.calculate_swing_strength(bars.iloc[:8], length=2)
        bearish = stock_scanner.calculate_swing_strength(bars, length=2)

        self.assertEqual(bullish["swing_high_type"], "Weak High")
        self.assertEqual(bullish["swing_low_type"], "Strong Low")
        self.assertEqual(bullish["swing_high_price"], 16)
        self.assertEqual(bullish["swing_low_price"], 10)
        self.assertEqual(bearish["swing_high_type"], "Strong High")
        self.assertEqual(bearish["swing_low_type"], "Weak Low")
        self.assertEqual(bearish["swing_high_price"], 16)
        self.assertEqual(bearish["swing_low_price"], 3)

    def test_summarize_swing_strength_counts_both_levels(self):
        import pandas as pd

        results = pd.DataFrame(
            {
                "swing_high_type": ["Strong High", "Weak High"],
                "swing_low_type": ["Weak Low", "Strong Low"],
            }
        )

        summary = stock_scanner.summarize_swing_strength(results)

        self.assertEqual(summary["count"].tolist(), [1, 1, 1, 1])

    def test_parse_args_accepts_sector_limit_and_dry_run(self):
        args = stock_scanner.parse_args(
            ["--sector", "IDXENERGY", "--limit", "5", "--dry-run"]
        )

        self.assertEqual(args.sector, "IDXENERGY")
        self.assertEqual(args.limit, 5)
        self.assertTrue(args.dry_run)

    def test_resolve_sector_selection_limits_tickers(self):
        selected = stock_scanner.resolve_sector_selection("IDXENERGY", 2)

        self.assertEqual(
            selected,
            {"IDXENERGY": stock_scanner.SECTOR_CONFIG["IDXENERGY"][:2]},
        )

    @patch("src.stock_scanner.save_to_bigquery")
    @patch("src.stock_scanner.analyze_sector")
    def test_dry_run_scans_selected_sector_without_upload(self, analyze_sector, save):
        import pandas as pd

        analyze_sector.return_value = pd.DataFrame(
            [{
                "sector": "IDXENERGY",
                "ticker": "TEST.JK",
                "score": 10,
                "action": "WAIT",
                "swing_high_type": "Weak High",
                "swing_low_type": "Weak Low",
            }]
        )

        result = stock_scanner.main(
            ["--sector", "IDXENERGY", "--limit", "1", "--dry-run"]
        )

        self.assertEqual(result, 0)
        analyze_sector.assert_called_once()
        self.assertEqual(analyze_sector.call_args.args[:2], (
            "IDXENERGY", stock_scanner.SECTOR_CONFIG["IDXENERGY"][:1]
        ))
        save.assert_not_called()


if __name__ == "__main__":
    unittest.main()