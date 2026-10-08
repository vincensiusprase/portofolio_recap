import sys
sys.path.insert(0, 'src')
import sectors
total = 0
for sector, tickers in sectors.SECTOR_CONFIG.items():
    print(f'{sector}: {len(tickers)} tickers')
    total += len(tickers)
print(f'Total: {total} tickers')