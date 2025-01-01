// ==UserScript==
// @name         betterEreter
// @version      0.3
// @description  better ereter.net
// @author       lily.C
// @match        http://ereter.net/iidxplayerdata/*/analytics/combined/
// @grant        none
// @updateURL    https://github.com/LilyCodeholic/betterEreterNet/raw/master/src/betterEreter.user.js
// ==/UserScript==

(() =>
{
"use strict"

//データを保存する関数
const saveOptionsToIndexedDB = (event) =>
{
	const selectElement = event.target
	const row = selectElement.closest("tr")
	const id = row.cells[1].querySelector("a").getAttribute("href").split("/")[2]
	const flip = row.querySelector(`select[name="flip"]`).value
	const left = row.querySelector(`select[name="left"]`).value
	const right = row.querySelector(`select[name="right"]`).value

	const request = indexedDB.open(nameDB, versionDB)
	request.onsuccess = (event) =>
	{
		const db = event.target.result
		const transaction = db.transaction(nameDB, "readwrite")
		const objectStore = transaction.objectStore(nameDB)

		const data = {id, flip, left, right}
		objectStore.put(data).onsuccess = () =>
		{
			console.log(`セーブしました: ${JSON.stringify(data)}`)
		}
	}
}

//テーブルを取得する
const table = document.querySelector("table")
//tbody trを取得しておく
const rows = document.querySelectorAll("tbody tr")

//データベース名とバージョンを定義する
const nameDB = "ereter-options"
const versionDB = 1

//IndexedDBのデータベースを開く
const request = indexedDB.open(nameDB, versionDB)

//データベースが存在しないか、バージョンが変わった場合に発火する
request.onupgradeneeded = (event) =>
{
	//データベースを取得する
	const db = event.target.result

	//テーブルが存在しない場合は作成する
	if(!db.objectStoreNames.contains(nameDB))
	{
		//テーブルを定義する
		const objectStore = db.createObjectStore(nameDB, {keyPath: "id"})
		objectStore.createIndex("indexTitle", "id", {unique: true})

		//行(譜面)の数だけ繰り返す
		for(const row of Array.from(table.rows).slice(1))
		{
			//タイトルを取得する
			const title = row.cells[1]
			//href部分を変数に格納
			const href = title.querySelector("a").getAttribute("href")
			const idScore = href.split("/")[2]

			//譜面IDとオプションの初期値を挿入する
			const put = objectStore.put({"id": idScore, "flip": "-", "left": "-", "right": "-"})
			put.onsuccess = (event) =>
			{
				console.log("レコードを追加しました")
			}
			put.onerror = (event) =>
			{
				console.error("レコードの追加中にエラーが発生しました", event.target.error)
			}
		}
	}
}
//データベースの取得に成功したときに発火
request.onsuccess = (event) =>
{
	//データベースを取得する
	const db = event.target.result

	//トランザクションの作成
	const transaction = db.transaction(nameDB, "readwrite")
	const objectStore = transaction.objectStore(nameDB)

	//インデックスを使用してデータを検索する
	const index = objectStore.index("indexTitle")

	//ドロップダウンメニューを作成する関数
	const createSelect = (classScore, options, name, selected) =>
	{
		const select = document.createElement("select")
		select.setAttribute("class", classScore)
		select.addEventListener("change", saveOptionsToIndexedDB)
		select.name = name
		options.forEach((option, index) =>
		{
			const opt = document.createElement("option")
			opt.value = option
			opt.textContent = option
			if(option === selected)
			{
				opt.selected = true
			}
			select.appendChild(opt)
		})

		return select
	}

	//行(譜面)の数だけ繰り返す
	for(const row of Array.from(table.rows).slice(1))
	{
		//オプション(非公式難易度)列を取得する
		const option = row.cells[0]
		//タイトル列を取得する
		const title = row.cells[1]
		//href部分(→譜面URL)を変数に格納
		const href = title.querySelector("a").getAttribute("href")
		const idScore = href.split("/")[2]

		//譜面IDと一致するレコードを検索する
		const get = index.get(idScore)
		get.onsuccess = (event) =>
		{
			const record = get.result
			//レコードが見つかった場合、そのレコードのoptionパラメータを取得する
			if(record)
			{
				//既存の内容をクリア
				option.innerHTML = ""

				//DocumentFragmentを作成
				const fragment = document.createDocumentFragment()

				//ドロップダウンメニューを作成
				const optionFlip = ["-", "F", "？"]
				const selectFlip = createSelect(idScore, optionFlip, "flip", record.flip)
				const optionLeft = ["-", "M", "R", "RR", "SR", "？"]
				const selectLeft = createSelect(idScore, optionLeft, "left", record.left)
				const optionRight = ["-", "M", "R", "RR", "SR", "？"]
				const selectRight = createSelect(idScore, optionRight, "right", record.right)
				fragment.appendChild(selectFlip)
				fragment.appendChild(selectLeft)
				fragment.appendChild(selectRight)

				//Fragmentをcellに追加
				option.appendChild(fragment)
			}
			//レコードが見つからなかった場合、flip, left, rightの初期値と合わせてレコードを追加する
			else
			{
				//譜面IDとオプションの初期値を挿入する
				const put = objectStore.put({"id": idScore, "flip": "-", "left": "-", "right": "-"})
				put.onsuccess = (event) =>
				{
					console.log(`レコードが見つからなかったのでレコードを追加しました。"id": ${idScore}`)
				}
				put.onerror = (event) =>
				{
					console.error("レコードの追加中にエラーが発生しました", event.target.error)
				}
			}
		}
		get.onerror = (event) =>
		{
			console.error(`エラーが発生しました: ${event.target.error}`)
		}
	}
}
//データベースの取得に失敗したときに発火
request.onerror = (event) =>
{
	console.log(`Database error: ${event.target.error}`)
}

//「☆」を「Option」に、「Clear Lamp」を「Lamp」に、「Difficulty」を「Diff」に、「Probability」を「%」にする
//「☆」列を取得する
const columnOption = table.rows[0].cells[0]
columnOption.textContent = "Option"
//「☆」列をクリックできないようにする
columnOption.style.pointerEvents = "none"
//「Clear Lamp」列を取得する
const columnClearLamp = table.rows[0].cells[2]
columnClearLamp.textContent = "Lamp"
//「Difficulty」列を取得する
const columnDifficulty = table.rows[0].cells[3]
columnDifficulty.textContent = "Diff"
//「Probability」列を取得する
const columnProbability = table.rows[0].cells[5]
columnProbability.textContent = "%"

//th行以外を取得する
for(const row of Array.from(table.rows).slice(1))
{
	const option = row.cells[0]
	const title = row.cells[1]
	const lamp = row.cells[2]

	//非公式難易度をオプションと置き換える
	//タイトルを短くする
	//href部分を変数に格納
	const href = title.querySelector("a").getAttribute("href")
	//曲名を変数に格納
	const textTitle = title.childNodes[0].textContent.split(" ").slice(0, -1).join(" ")
	//style要素を取得
	const styleTitle = title.querySelector("span").style.color
	//曲名部分を置き換える
	title.innerHTML = `<a href="${href}" target="_blank"><span style="color: ${styleTitle}">${textTitle}</span></a>`

	//クリアランプの表示を短くする
	if(lamp.textContent.startsWith("EX-HARD"))
	{
		lamp.innerHTML = `<span style="color: #efef51">EXH</span>`
	}
}
//cssの設定
const style = document.createElement("style")
style.textContent = `
select{
	-moz-appearance: none;
	appearance: none;
	border-radius: 0.25rem;
	padding: 0.1rem 0.5rem;
	background-color: #434857;
	color: lightgray;
	font-size: 0.8rem;
	text-align: center;
	cursor: pointer;
}
select:hover{
	background-color: #8690AE;
}
select:focus{
	outline: none;
	border-color: #0066cc;
}
td{
	padding: 0.1rem 0.3rem !important;
	vertical-align: middle !important;
}
td:first-child{
	white-space: nowrap !important;
}
`
document.head.append(style)

})()
