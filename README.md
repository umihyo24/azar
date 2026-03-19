# azar

ブラウザで動く、Canvas ベースの「もんすたぁレース風」試作ゲームです。

## `.gitkeep` とは？
前回入っていた `.gitkeep` は**画像ファイルではありません**。
Git は「空のフォルダ」をそのまま保存できないため、
`assets/characters` のような空フォルダをリポジトリに残すためだけに入れる
ダミーファイルとしてよく使われます。

つまり、`.gitkeep` があるからといって特別な設定が必要なわけではありません。
**本来はそこに普通に画像を置いて大丈夫です。**

今回は分かりやすさを優先して、`.gitkeep` の代わりに説明用の `README.md` を
各 assets フォルダに置いてあります。

## キャラクター画像の置き場所
キャラクター画像は次のフォルダに入れてください。

```text
assets/characters/
```

ファイル名は次の想定です。

```text
normal_normal.png
normal_charge.png
speed_normal.png
speed_charge.png
sanma_normal.png
sanma_charge.png
```

画像がまだ無い場合でも、ゲームはプレースホルダー表示で動きます。

## 起動方法
Python が入っていれば、以下でローカル起動できます。

```bash
python3 -m http.server 8000
```

その後、ブラウザで以下を開いてください。

```text
http://localhost:8000/
```
