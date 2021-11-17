## Pivotal TrackerにStoryを一括でimportする
0. pivotalからトークンを取得する（https://www.pivotaltracker.com/profile）
1. pivotalStories.csvファイルを配置する
2. csvRowToData関数の処理を書き換える
3. 以下のスクリプトを叩く

```shell
$ PROJECT_ID=xxxxxx npx ts-node bulkCreateStories.ts
```
