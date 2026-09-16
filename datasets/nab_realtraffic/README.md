# NAB realTraffic dataset (CCA116)

Shared test dataset for the Correlation sub team, replacing the simulated
`complex.csv`, whose streams were too degenerate to test alert quality.

## Files

| File | Rows | Streams | Purpose |
|---|---|---|---|
| `traffic_4stream_merged.csv` | 1,853 | 4 | primary dataset |
| `aws_control_merged.csv` | 4,024 | 3 | negative control, independent streams |
| `labels_subset.json` | | | NAB anomaly windows for the 7 source streams |

## Source and licence

Numenta Anomaly Benchmark v1.0, https://github.com/numenta/NAB, licence
AGPL 3.0, which permits redistribution. No account and no API key. Pinned to
commit `ea702d75`, so the source files cannot move under us. Nothing here
needs a credential, which is part of why this source was chosen over a live
export.

To rebuild from source:

```bash
BASE=https://raw.githubusercontent.com/numenta/NAB/ea702d75/data
mkdir -p raw
for f in realTraffic/occupancy_t4013 realTraffic/speed_t4013 \
         realTraffic/occupancy_6005 realTraffic/speed_6005 \
         realAWSCloudwatch/ec2_cpu_utilization_825cc2 \
         realAWSCloudwatch/ec2_network_in_257a54 \
         realAWSCloudwatch/elb_request_count_8c0756; do
  curl -sfL "$BASE/$f.csv" -o "raw/$(basename $f).csv"
done
python build_merged.py
```

The rebuilt files should be byte identical to the ones committed here. The
expected SHA256 of `traffic_4stream_merged.csv` is
`7993c7f5…8c9f8f5f` and of `aws_control_merged.csv` is `0e775186…de679ed3c`.

## Why these two files

**`traffic_4stream_merged.csv`** is the only candidate with four populated
streams, none degenerate, plus NAB ground truth labels covering three
separate events. Without labels the "measure alert correctness" step cannot
be done at all. Occupancy and speed from two Minnesota DoT stations, joined
on exact timestamp, 1 to 17 September 2015, nominal 5 minute sampling.

| Stream | Distinct | Std dev | NaN |
|---|---|---|---|
| occupancy_t4013 | 308 | 4.37 | 0 |
| speed_t4013 | 51 | 5.52 | 0 |
| occupancy_6005 | 174 | 3.45 | 0 |
| speed_6005 | 55 | 8.44 | 0 |

**`aws_control_merged.csv`** answers the other half of the question. Its three
streams were measured to be independent, pairwise Pearson −0.001, +0.036 and
+0.021, so the correct answer on it is close to zero alerts. Step 4 of the
task asks for a false positive review, which is not possible without a file
whose answer is known to be "stay quiet".

## Before you use it

1. **Sampling is irregular.** Most gaps are 5 minutes, some are 10, 15 or 20.
   Rolling window results are not meaningful until this is resampled.
2. **Agree forward fill against NaN as a team and write the choice down.**
   `min_periods` behaves differently under each.
3. **Evaluate per pair, not per file.** Four streams give six pairs at very
   different strengths. One overall count hides being right on one pair and
   wrong on another.
4. **Compare alerts per comparison, never raw totals.** Different window and
   step settings produce different numbers of comparisons.

## Known limitations

- **No vibration stream.** The task names vibration, temperature and
  occupancy. This provides occupancy only. Vibration belongs to machine
  condition monitoring, occupancy to building monitoring, and no reputable
  public dataset records both in one synchronised file. Joining two unrelated
  recordings on timestamp would manufacture correlations that do not exist,
  which is worse than the gap.
- **The Kaggle mirror `boltzmannbrain/nab` ships no `labels/` folder.** Take
  labels from GitHub.
- **Versions are not pinned in the repo.** pandas releases differ in how
  rolling correlation treats NaN and zero variance windows, so two people can
  run the same file and get different alert counts. Every number recorded in
  `correlation_alert/docs/evidence/CCA116_tommy/` was produced on
  pandas 2.3.3 and numpy 2.2.6. Pinning is still open.
