import json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

root = Path(__file__).resolve().parent / 'out'
report = json.loads((root / 'corner-slide-report.json').read_text())
row = next(r for r in report['seams'] if r['fixture'] == {'name': '1 m joints / 0.001 m offset', 'width': 1, 'inset': .001})
plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 15, 'text.color': '#f8e8c6', 'axes.labelcolor': '#afc3c1', 'xtick.color': '#afc3c1', 'ytick.color': '#afc3c1', 'axes.edgecolor': '#576966'})
for side, version, colour in [('before', '2.43.2', '#df9867'), ('after', '2.43.3', '#9dd0aa')]:
    trace = row[side]['trace']
    times = [s['time'] for s in trace]
    distances = [s['camera']['z'] - trace[0]['camera']['z'] for s in trace]
    speeds = [(trace[i]['camera']['z'] - trace[i-1]['camera']['z']) * 120 for i in range(1, len(trace))]
    fig, axes = plt.subplots(2, 1, figsize=(14.4, 10), dpi=100, sharex=True, facecolor='#111d22')
    for ax in axes:
        ax.set_facecolor('#111d22'); ax.grid(color='#445b59', alpha=.5); ax.spines[['top', 'right']].set_visible(False); ax.set_xlim(0, 2)
    axes[0].plot(times, distances, color=colour, linewidth=3)
    axes[0].set_ylim(0, 5.5); axes[0].set_ylabel('Travel along wall (m)')
    axes[1].plot(times[1:], speeds, color=colour, linewidth=3)
    axes[1].axhline(3.8 / 2**.5, color='#afc3c1', linewidth=1, linestyle='--', label='Flat-wall tangent / 2.687 m/s')
    axes[1].set_ylim(0, 3); axes[1].set_ylabel('Presented tangent speed (m/s)'); axes[1].set_xlabel('Replay time (seconds)'); axes[1].legend(facecolor='#203238', edgecolor='#576966', labelcolor='#f8e8c6', loc='lower left')
    fig.suptitle(f'{side.upper()} / {version}: 1 m joints, 1 mm offset', fontsize=26, weight='bold', x=.08, ha='left')
    fig.text(.08, .02, 'Production Player at 120 Hz; fixed diagonal keys. Interpolated camera samples, no physical input or FPS measurement.', fontsize=12, color='#afc3c1')
    fig.subplots_adjust(left=.10, right=.97, top=.88, bottom=.10, hspace=.22)
    fig.savefig(root / f'corner-slide-{side}-plot.png', facecolor=fig.get_facecolor()); plt.close(fig)
print('COMPLETE matched standalone corner-slide plots')
