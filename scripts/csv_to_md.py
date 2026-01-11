import pandas as pd

def csv_to_md(csv_file, md_file):
    try:
        df = pd.read_csv(csv_file)
        
        # Sort by Profit (Desc) as default
        df = df.sort_values(by='PROFIT_USDT', ascending=False)
        
        with open(md_file, 'w') as f:
            f.write("# Full Simulation Results (90 Days)\n")
            f.write("**Strategy**: Buy Dip (Standard Dynamic Spacing)\n\n")
            f.write("| COIN | PROFIT ($) | MAX DD (%) | TRADES | STUCK (Days) | BAGS |\n")
            f.write("| :--- | :--- | :--- | :--- | :--- | :--- |\n")
            
            for index, row in df.iterrows():
                f.write(f"| {row['COIN']} | ${row['PROFIT_USDT']:.2f} | {row['MAX_DRAWDOWN_PCT']:.2f}% | {row['TRADES']} | {row['STUCK_DAYS']:.1f} | {row['END_POSITIONS']} |\n")
                
        print(f"Successfully wrote {len(df)} rows to {md_file}")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    csv_to_md('analysis_results_all.csv', 'full_simulation_results.md')
