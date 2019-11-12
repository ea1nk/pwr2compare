# pwr2compare
Basic cycling power meter comparator
---
Simple NodeJS based tool to compare the measures from two ANT+ cycling power meters.

**Installation:**

```
git clone https://github.com/ea1nk/pwr2compare.git
```
```
npm install
```

**Usage:**

Both ANT+ device IDs and an optional averaging time in seconds must be provided.

If no averaging factor is provided, it will be defaulted to 3 seconds.
```
node server.js ID1 ID2 averaging_time
```
