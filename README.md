# betterEreterNet
このユーザースクリプトはereter.netの/"任意のユーザーID"/analytics/combined/のページを以下の通り変更します。下記の機能はサイトには負荷をかけず、全てブラウザ上で完結しています。
Tampermonkeyで動作を確認しています。

## 機能
- 非公式難易度の非表示
	- 「☆」(非公式難易度)を「Option」にします。
 	- 「☆」の位置に使用オプション(FLIP, RANDOMなど)を保存できるようにします。入力したオプションはブラウザに保存されます。
	- 「☆」はソートするためのクリックができなくなります。
- 列の幅の調整
	- 「Clear Lamp」を「Lamp」にします。
	- 「Difficulty」を「Diff」にします。
	- 「Probability」を「%」にします。
	- 「title」の難易度表記(ANOTHER, LEGGENDARIAなど)をフォントの色で識別できるようにします。
	- 「Clear Lamp」の"EX-HARD"を"EXH"にします。
- 行間の調整
	- 1画面に表示する譜面数を多くするため、行間を少し狭くします。

## Tampermonkeyにインストールする方法
- Tampermonkeyの拡張機能ページを開き、"ユーティリティ"タブの"URL からインポート"に下記を入力して"インストール"をクリックします。
~~~
https://github.com/LilyCodeholic/betterEreterNet/raw/refs/heads/main/src/betterEreter.user.js
~~~

## お問い合わせ
- https://x.com/Lily_C___/

---

# betterEreterNet
This user script modifies the /”any user ID”/analytics/combined/ page on ereter.net as follows. These features are executed entirely within the user's browser.
I have confirmed the operation with Tampermonkey.

## Features
- Hide unofficial difficulty
	- Change "☆" (unofficial difficulty) to "Option".
	- You can save the options (FLIP, RANDOM, etc.) in the "☆" column. The options are saved in your browser.
	- "☆" will no longer be clickable for sorting.
- Adjust column width
	- Change "Clear Lamp" to "Lamp".
	- Change "Difficulty" to "Diff".
	- Change "Probability" to "%".
	- The difficulty level of "title" (ANOTHER, LEGGENDARIA, etc.) can be identified by the font color.
	- Change "EX-HARD" of "Clear Lamp" to "EXH".
- Adjust line spacing
	- To display more scores on the screen, the line spacing made slightly narrower.

## How to install on Tampermonkey
- Open Tampermonkey's extension page, copy and paste the following into "Import from URL" on the "Utilities" tab and click "Install".
~~~
https://github.com/LilyCodeholic/betterEreterNet/raw/refs/heads/main/src/betterEreter.user.js
~~~

## Feedback
- https://x.com/Lily_C___/
