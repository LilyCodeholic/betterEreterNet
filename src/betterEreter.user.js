// ==UserScript==
// @name         betterEreter
// @version      0.5
// @description  better ereter.net
// @author       lily.C
// @match        http://ereter.net/iidxplayerdata/*/analytics/combined/
// @match        http://ereter.net/iidxplayerdata/*/level/12/
// @grant        none
// @updateURL    https://github.com/LilyCodeholic/betterEreterNet/raw/master/src/betterEreter.user.js
// @downloadURL  https://github.com/LilyCodeholic/betterEreterNet/raw/master/src/betterEreter.user.js
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
	const diffRow = row.cells[3].getAttribute("sort-value")
	const diff = parseFloat(diffRow).toFixed(3)

	//IndexedDBに保存する
	const request = indexedDB.open(nameDB, versionDB)
	request.onsuccess = (event) =>
	{
		const db = event.target.result
		const transaction = db.transaction(nameDB, "readwrite")
		const objectStore = transaction.objectStore(nameDB)

		const data = {id, flip, left, right, diff}
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
//バージョン履歴
//～0.4: 1 → 初期バージョン
//  0.5: 2 → ereter難易度の追加
const nameDB = "ereter-options"
const versionDB = 2

//IndexedDBのデータベースを開く
const request = indexedDB.open(nameDB, versionDB)

//データベースが存在しないか、バージョンが変わった場合に発火する
request.onupgradeneeded = (event) =>
{
	//データベースを取得する
	const db = event.target.result

	///analytics/combined/ページでない場合はereter難易度を取得できないので何もしない
	if(!window.location.pathname.includes("/analytics/combined/"))
	{
		return
	}

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
			//譜面のereter難易度を取得する
			//難易度はtd sort-value="～～"の部分の小数点三桁まで取得する
			const diffRow = row.cells[3].getAttribute("sort-value")
			const diff = parseFloat(diffRow).toFixed(3)

			//譜面IDとオプションの初期値を挿入する
			const put = objectStore.put({"id": idScore, "flip": "-", "left": "-", "right": "-", "diff": diff})
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
	//テーブルが存在する場合は項目を追加する
	else if(db.objectStoreNames.contains(nameDB) && event.oldVersion < 2)
	{
		//既存のidにdiffを追加する
		const objectStore = event.target.transaction.objectStore(nameDB)
		objectStore.openCursor().onsuccess = (e) =>
		{
			const cursor = e.target.result
			if(cursor)
			{
				const data = cursor.value
				data.diff = ""
				cursor.update(data)
				cursor.continue()
			}
		}
		console.log("データベースのアップグレードが完了しました")
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
		//一番左のselect(flip)だけ狭くするためにclassを追加する
		if(name === "flip")
		{
			select.classList.add("first-select")
		}
		options.forEach((option, index) =>
		{
			//パソコン版のページの場合は、最初のoptionsを挿入しない
			if(!navigator.userAgent.match(/iPhone|Android/) && index === 0)
			{
				return
			}

			const opt = document.createElement("option")
			opt.textContent = option
			//モバイル版のページのみ、最初のオプションは曲名なので選択できないようにする
			if(index === 0)
			{
				opt.disabled = true
			}
			else
			{
				opt.value = option
			}
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
		//譜面のereter難易度を取得する
		//難易度はtd sort-value="～～"の部分の小数点三桁まで取得する
		const diffRow = row.cells[3].getAttribute("sort-value")
		const diff = parseFloat(diffRow).toFixed(3)

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

				//全角換算で20文字までにカット
				const omitTextLength = (str, maxLen) => {
					let len = 0
					let result = ""
					for(const ch of str)
					{
						len += (ch.charCodeAt(0) > 255) ? 1 : 0.5
						//文字数がmaxLenを超えたら、短縮したことを表す文字を追加してループを抜ける
						if(len > maxLen)
						{
							result += "…"
							break
						}
						result += ch
					}
					return result
				}
				const shortTitle = omitTextLength(title.childNodes[0].textContent, 19)

				//ドロップダウンメニューを作成
				const optionFlip = [`${shortTitle}: FLIP\u00A0`, "-", "F", "？"]
				const selectFlip = createSelect(idScore, optionFlip, "flip", record.flip)
				const optionLeft = [`${shortTitle}: LEFT\u00A0`, "-", "M", "R", "RR", "SR", "？"]
				const selectLeft = createSelect(idScore, optionLeft, "left", record.left)
				const optionRight = [`${shortTitle}: RIGHT\u00A0`, "-", "M", "R", "RR", "SR", "？"]
				const selectRight = createSelect(idScore, optionRight, "right", record.right)
				fragment.appendChild(selectFlip)
				fragment.appendChild(selectLeft)
				fragment.appendChild(selectRight)

				//Fragmentをcellに追加
				option.appendChild(fragment)

				//diffが空文字か既存のデータと差異がある場合、ereter難易度を更新する
				if(record.diff === "" || record.diff !== diff)
				{
					const updatedRecord = {id: idScore, flip: record.flip, left: record.left, right: record.right, diff: diff}
					const updateRequest = objectStore.put(updatedRecord)
					updateRequest.onerror = (event) =>
					{
						console.error("パラメータの追加中にエラーが発生しました", event.target.error)
					}
				}
			}
			//レコードが見つからなかった場合、flip, left, rightの初期値と合わせてレコードを追加する
			else
			{
				//譜面IDとオプションの初期値を挿入する
				const put = objectStore.put({"id": idScore, "flip": "-", "left": "-", "right": "-", "diff": diff})
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

///analytics/combined/ページ用の処理
if(window.location.pathname.includes("/analytics/combined/"))
{
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

	//「Title」を短くする、クリアランプの表示を短くする
	//th行以外を取得する
	for(const row of Array.from(table.rows).slice(1))
	{
		const title = row.cells[1]
		const lamp = row.cells[2]

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

	//エクスポートとインポートのボタンとテキストボックスを追加する
	//DOMを追加する場所のflexboxを調整する
	const divFlex = document.querySelector("div.col-md-3.pt-3")
	divFlex.classList.remove("col-md-3")
	divFlex.classList.add("col-md-9")

	//追加するボタンとテキストボックスの作成
	const exportButton = document.createElement("button")
	exportButton.setAttribute("class", "blend")
	exportButton.setAttribute("type", "button")
	exportButton.textContent = "Export OP"
	exportButton.style.marginRight = "1rem"

	const importButton = document.createElement("button")
	importButton.setAttribute("class", "blend")
	importButton.setAttribute("type", "button")
	importButton.textContent = "Import OP"
	importButton.style.marginRight = "1rem"

	const textBox = document.createElement("textarea")
	textBox.style.width = "25%"
	textBox.style.height = "2rem"

	//DOMの挿入場所の指定
	const position = document.querySelector("div.input-group")
	//DOMの挿入
	position.insertAdjacentElement("beforeend", exportButton)
	position.insertAdjacentElement("beforeend", importButton)
	position.insertAdjacentElement("beforeend", textBox)

	//エクスポートボタンクリック時の処理
	exportButton.addEventListener("click", () =>
	{
		const request = indexedDB.open(nameDB, versionDB)
		request.onsuccess = (event) =>
		{
			const db = event.target.result
			const transaction = db.transaction(nameDB, "readonly")
			const objectStore = transaction.objectStore(nameDB)
			const getAllRequest = objectStore.getAll()

			getAllRequest.onsuccess = () =>
			{
				textBox.value = JSON.stringify(getAllRequest.result, null, 2)
			}
		}
	})
	//インポートボタンクリック時の処理
	importButton.addEventListener("click", () =>
	{
		const data = JSON.parse(textBox.value)
		const request = indexedDB.open(nameDB, versionDB)
		request.onsuccess = (event) =>
		{
			const db = event.target.result
			const transaction = db.transaction(nameDB, "readwrite")
			const objectStore = transaction.objectStore(nameDB)

			data.forEach((item) =>
			{
				objectStore.put(item)
			})

			transaction.oncomplete = () =>
			{
				//アラートを日本語と英語で表示する
				window.alert("オプションのインポートが完了しました。\nThe import of options is complete.")
			}
		}
	})
}
///level/12/ページ用の処理
else if(window.location.pathname.includes("/level/12/"))
{
	//「☆」を「Option」に、「Rank」を「Diff」に、「Clear lamp」を「Lamp」にする
	//「☆」列を取得する
	const columnOption = table.rows[0].cells[0]
	columnOption.textContent = "Option"
	//「☆」列をクリックできないようにする
	columnOption.style.pointerEvents = "none"
	//「Rank」列を取得する
	const columnClearLamp = table.rows[0].cells[2]
	columnClearLamp.textContent = "Diff"
	//「Clear lamp」列を取得する
	const columnProbability = table.rows[0].cells[5]
	columnProbability.textContent = "Lamp"

	//th行以外を取得する
	for(const row of Array.from(table.rows).slice(1))
	{
		const title = row.cells[1]
		const lamp = row.cells[5]

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
			lamp.innerHTML = `<span style="color: #efef51">EXHARD</span>`
		}

		//「Score rank」のclass="text-nowrap"のspanの下の最初のspan要素を削除する
		const scoreRank = row.cells[4].querySelector("span.text-nowrap")
		//NOPLAYのときはspan要素がないので、scoreRankが存在するか確認
		if(scoreRank)
		{
			const firstSpan = scoreRank.querySelector("span")
			if(firstSpan)
			{
				firstSpan.remove()
			}
		}
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
	border: 1px solid #434857;
	background-color: #434857;
	color: lightgray;
	font-size: 0.8rem;
	text-align: center;
	cursor: pointer;
	width: 2rem;
}
select.first-select{
	width: 1.5rem;
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
.blend{
	background-color: #434857;
	color: lightgray;
	border: 1px solid #434857;
	border-radius: 0.25rem;
	padding: 0.1rem 0.5rem;
	font-size: 0.9rem;
	cursor: pointer;
}
`
document.head.append(style)

})()
