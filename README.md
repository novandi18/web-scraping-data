# Web Scraping Data from Kerjabilitas.com

**Reminder** that this tool only can use for scraping data from **kerjabilitas.com**!

## How to use

```
node main id -l 'txt_file.txt'
```

## Arguments

| Name           | Description             | Status                        |
| -------------- | ----------------------- | ----------------------------- |
| id             | ID vacancy from url     | Required if ID is only 1      |
| -l             | Mark for ID more than 1 | Required if ID is more than 1 |
| 'txt_file.txt' | ID list in the TXT File | Required if -l is given       |

## Examples

- 1 ID

```
node main KSJJKHS
```

- More than 1 ID

```
node main -l 'list_id.txt'
```
