var currentTime = new Date().getHours();
if (document.body) {
  if (7 <= currentTime && currentTime < 20) {
    document.body.background = "image/background.jpg";
  }
  else {
    document.body.background = "image/background2.png";
  }
}
function tex2jax(tex) {
	let s = new String(tex);
	let il = -1;
	let ir = -1;
	let len = s.length;

	// Chuyển $ thành \(\)
	while(true) {
		il = s.indexOf("$");
		if (il < 0 || il == len-1) break;
		ir = s.indexOf("$", il+1);
		if (ir < 0) break;
		s = s.substring(0, il) + "\\(" + s.substring(il+1, ir) + "\\)" + s.substring(ir+1);
	}

	s = s.replace(/\\begin{center}/g, "<center>");
	s = s.replace(/\\end{center}/g, "</center>");
	s = s.replace(/\\begin{enumerate}\s*\\item/g, "<ul><li>");
	s = s.replace(/\\item/g, "</li><li>");
	s = s.replace(/\\end{enumerate}/g, "</li></ul>");
	s = s.replace(/\\\\/g, "<br>");
	s = s.replace(/\\textbf{([^}]*)}/g, "<b>$1</b>");
	s = s.replace(/\\textit{([^}]*)}/g, "<i>$1</i>");

	return s;
}

function tex2html(tex) {
	let ls = ""; // left string
	let cs = ""; // center string
	let rs = ""; // right string
	
	let il = tex.indexOf("\\begin{tikzpicture}"); // image left
	let ir = tex.indexOf("\\end{tikzpicture}"); // image right

	if (il > 0 && ir > 0 && il < ir) {
		ls = tex.substring(0, il);
		cs = tex.substring(il, ir);
		rs = tex.substring(ir);
		ls = tex2jax(ls);
		rs = tex2html(rs);
	} else {
		ls = tex2jax(tex);
		cs = "";
		rs = "";
	}
	return (ls + cs + rs);
}

function parseTex(tex) {
	// Tách các xuống dòng thành các chuỗi text
	let v = new String(tex).split(/\r\n|\r|\n/g);

	// Xoá các comment, xoá các space thừa ở giữa, xoá indent và space ở đầu và cuối
	for (let i = 0; i < v.length; i++) {
		v[i] = v[i].replace(/%.*$/g, "").replace(/\s\s*/g, " ").trim();
	}
    
	let h = []; // Hỏi
	let p = []; // Hình vẽ 
	let d = []; // Đúng
	let t1 = []; // Trả lời 1
	let t2 = []; // Trả lời 2
	let t3 = []; // Trả lời 3
	let g = []; // Giải
	let noq = -1; // No of questions
	let reserved = false; // ?
	let havePicture = false;

	// duyệt từng chuỗi, nếu state = 0 thì là chưa bắt đầu câu hỏi
	// state = 1 thì là \begin{ex}
	// state = 2 thì là \choice
	let state = 0;

	// Chuỗi để lưu string đang xử lý
	let s = ""; // ?

	// Duyệt từng đoạn tex
	for (let i = 0; i < v.length; i++) {
		// check xem có phải picture ko?
		if (v[i].indexOf("\\begin{tikzpicture}") >= 0) reserved = true;
		
		// 
		if (state == 0) { // chua bat dau cau hoi
			if (v[i].toLowerCase().indexOf("\\begin{ex}") == 0) {
				state = 1;
				s = v[i].substring("\\begin{ex}".length); // khoi tao H
			} else if (v[i].toLowerCase() == "\\immini" || v[i].toLowerCase() == "\\immini {") {
				havePicture = true;
			}
		} else if (state == 1) { //H
			if (v[i].toLowerCase().indexOf("\\choice") == 0) {
				s = s.trim();
				s = tex2html(s);
				s = "<p>" + s + "</p>"
				//
				noq++;
				h.push(new String(s));
				p.push("");
				d.push("");
				t1.push("");
				t2.push("");
				t3.push("");
				g.push("");
				//
				state = 2;
				s = "";
			} else {
				if (v[i] == "") {
					if (reserved) s += "<br>";
					else s += "</p><p>";
				}
				else {
					s += v[i];
					if (reserved) s += "<br>";
				}
			}
		} else if (state == 2) { //A
			if (v[i] == "") {
				if (s != "") {
					if (reserved) s += "<br>";
					else s += "</p><p>";
				}
			} else {
				s += v[i];
				if (reserved) s += "<br>";
			}

			if (v[i][v[i].length-1] == '}') {
				s = s.replace(/^\s*{\s*/,"").replace(/\s*}*$/,"").trim();
				s = tex2html(s);
				s = "<p>" + s + "</p>";
				d[noq] = new String(s);
				//
				state = 3;
				s = "";
			}

		} else if (state == 3) { //B
			if (v[i] == "") {
				if (s != "") {
					if (reserved) s += "<br>";
					else s += "</p><p>";
				}
			} else {
				s +=  v[i];
				if (reserved) s += "<br>";
			}

			if (v[i][v[i].length-1] == '}') {
				s = s.replace(/^\s*{\s*/,"").replace(/\s*}$/,"").trim();
				s = tex2html(s);
				s = "<p>" + s + "</p>";
				t1[noq] = new String(s);
				//
				state = 4;
				s = "";
			}
		} else if (state == 4) { // C
			if (v[i].toLowerCase().replace(/\\loigiai\s*{/,"\\solution{").indexOf("\\solution{") == 0) {
				t2[noq] = "-";
				t3[noq] = "-";
				//
				state = 6;
				s = "";
			}
			
			if (v[i] == "") {
				if (s != "") {
					if (reserved) s += "<br>";
					else s += "</p><p>";
				}
			} else {
				s += v[i];
				if (reserved) s += "<br>";
			}

			if (v[i][v[i].length-1] == '}') {
				s = s.replace(/^\s*{\s*/,"").replace(/\s*}$/,"").trim();
				s = tex2html(s);
				s = "<p>" + s + "</p>";
				t2[noq] = new String(s);
				//
				state = 5;
				s = "";
			}
		} else if (state == 5) { //D
			if (v[i].toLowerCase().replace(/\\loigiai\s*{/,"\\solution{").indexOf("\\solution{") == 0) {
				t3[noq] = "-";
				//
				state = 6;
				s = "";
			}


			if (v[i] == "") {
				if (s != "") {
					if (reserved) s += "<br>";
					else s += "</p><p>";
				}
			} else {
				s += v[i];
				if (reserved) s += "<br>";
			}

			if (v[i][v[i].length-1] == '}') {
				s = s.replace(/^\s*{\s*/,"").replace(/\s*}$/,"").trim();
				s = tex2html(s);
				s = "<p>" + s + "</p>"
				t3[noq] = new String(s);
				//	
				state = 6;
				s = "";
			}
		} else if (state == 6) { //G
			if (v[i].toLowerCase() == "\\end{ex}") {
				s = s.replace(/\\loigiai\s*{/,"\\solution{");
				let vv = s.split("\\solution");
				if (vv.length == 2) {
					h[noq] += vv[0];
					s = vv[1];
				} else {
					s = s.replace(/\\solution/,"");
				}
				s = s.replace(/^\s*{\s*/,"").replace(/\s*}\s*$/,"").trim();
				s = tex2html(s);
				s = "<p>" + s + "</p>";
				g[noq] = new String(s);
				//
				s = "";
                state = 7;
			} else {		
				if (v[i] == "") {
					if (reserved) s += "<br>";
					else s += "</p><p>";
				} else {
					s += v[i];
					if (reserved) s += "<br>";
				}
			}
		} else if (state == 7) { // P
			if (havePicture) {
				if (v[i] === '\\end{tikzpicture}') {
					p[noq] += v[i];
					havePicture = false;
					state = 0;
				} else if (v[i] !== '}{' && v[i] !== '{' && v[i] !== '}') {
					p[noq] += v[i] + '<br/>';
				}
			} else {
				state = 0;
			}
		}

		if (v[i].indexOf("\\end{tikzpicture}") >= 0) reserved = false;

	}

	//
	//
	//
	noq++;
	let html = "";
	for (let i = 0; i < noq; i++) {
		//
		//
		// Dua dap an len dau
		if (d[i].indexOf("<p>\\True") == 0) {
		} else if (t1[i].indexOf("<p>\\True") == 0) {
			let tmp = new String(t1[i]);
			t1[i] = new String(d[i]);
			d[i] = tmp;
		} else if (t2[i].indexOf("<p>\\True") == 0) {
			let tmp = new String(t2[i]);
			t2[i] = new String(d[i]);
			d[i] = tmp;
		} else if (t3[i].indexOf("<p>\\True") == 0) {
			let tmp = new String(t3[i]);
			t3[i] = new String(d[i]);
			d[i] = tmp;
		}
		d[i] = d[i].replace(/^<p>\\True/, "<p>");


		//
		//
		// tạo HTML
		html += "<p><br></p>";

		html += "<table>";

		html += "<tr>";
		html += "<td>H</td>";
		html += "<td><div class='flex_container'>";
		html += "<div class='flex_item'>"+h[i]+"</div>";
		if (p[i].length > 0) {
			html += "<div class='flex_item picture'><p>"+p[i]+"</p></div>";
		}
		html += "</div></td>";
		html += "</tr>";
    
		html += "<tr>";
		html += "<td>Đ</td>";
		html += "<td colspan='2'>"+d[i]+"</td>";
		html += "</tr>";

		html += "<tr>";
		html += "<td>T1</td>";
		html += "<td colspan='2'>"+t1[i]+"</td>";
		html += "</tr>";

		html += "<tr>";
		html += "<td>T2</td>";
		html += "<td colspan='2'>"+t2[i]+"</td>";
		html += "</tr>";

		html += "<tr>";
		html += "<td>T3</td>";
		html += "<td colspan='2'>"+t3[i]+"</td>";
		html += "</tr>";

		html += "<tr>";
		html += "<td>K</td>";
		html += "<td colspan='2'>2</td>";
		html += "</tr>";

		html += "<tr>";
		html += "<td>M</td>";
		html += "<td colspan='2'>1</td>";
		html += "</tr>";

		html += "<tr>";
		html += "<td>G</td>";
		html += "<td colspan='2'>"+g[i]+"</td>";
		html += "</tr>";

		html += "</table>";
	}
	return html;
} 
document.querySelector("input#do-reset").onclick = function() {
document.querySelector("textarea.input").value = "";
document.querySelector("div#a").innerHTML = "";
};

document.querySelector("button#do-convert").onclick = function() {
let html = parseTex(document.querySelector("textarea.input").value);
document.querySelector("div#a").innerHTML = html;
};