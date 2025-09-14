import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

URL = "https://addon.jinhakapply.com/RatioV1/RatioH/Ratio41260461.html"

def to_int(val: str) -> int:
    val = val.strip()
    if val == "" or "제한없음" in val or "없음" in val:
        return 0
    val = val.replace(",", "")
    try:
        return int(val)
    except:
        return 0

def to_float(val: str) -> float:
    val = val.strip()
    if val == "" or "없음" in val:
        return 0.0
    try:
        return float(val.split(":")[0].strip())
    except:
        return 0.0

@app.get("/crawl")
def crawl():
    res = requests.get(URL)
    res.encoding = "utf-8"
    soup = BeautifulSoup(res.text, "html.parser")

    result = []

    # 전형별 학과 표 (tableRatio3)
    detail_tables = soup.find_all("table", class_="tableRatio3")
    for table in detail_tables:
        h2 = table.find_previous("h2")
        전형명 = h2.get_text(strip=True) if h2 else "전형"

        rows = table.find_all("tr")[1:]  # 헤더 제외
        current_계열 = None  # rowspan 처리용

        for tr in rows:
            cols = [td.get_text(strip=True) for td in tr.find_all("td")]

            # 계열명은 첫 번째 td에 나오지만 rowspan이면 비어있음
            if len(cols) == 5:  
                # 계열 있음
                current_계열 = cols[0]
                학과, 모집, 지원, 경쟁률 = cols[1:5]
            elif len(cols) == 4:
                # 계열 없음 → 이전 값 사용
                학과, 모집, 지원, 경쟁률 = cols[0:4]
            else:
                continue

            result.append({
                "전형명": 전형명,
                "계열": current_계열,
                "학과": 학과,
                "모집인원": to_int(모집),
                "지원자수": to_int(지원),
                "경쟁률": to_float(경쟁률)
            })

    return {"data": result}
