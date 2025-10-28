import requests
from bs4 import BeautifulSoup, Tag
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CURRENT_YEAR_URL = "https://addon.jinhakapply.com/RatioV1/RatioH/Ratio41260461.html"
LAST_YEAR_URL = "https://apply.jinhakapply.com/SmartRatio/PastRatioUniv?univid=4126&year=2025&category=1"


def to_int(val: str) -> int:
    val = val.strip()
    if val == "" or "제한없음" in val or "없음" in val or val == "-":
        return 0
    val = val.replace(",", "")
    try:
        return int(val)
    except (ValueError, TypeError):
        return 0


def to_float(val: str) -> float:
    val = val.strip()
    if val == "" or "없음" in val or val == "-":
        return 0.0
    try:
        # "2.6:1" 같은 형식에서 "2.6"만 추출
        return float(val.split(":")[0].strip())
    except (ValueError, TypeError, IndexError):
        return 0.0


@app.get("/crawl")
def crawl():
    res = requests.get(CURRENT_YEAR_URL)
    res.encoding = "utf-8"
    soup = BeautifulSoup(res.text, "html.parser")

    result = []

    # 1. 일반 전형별 학과 표 (tableRatio3) 크롤링
    detail_tables = soup.find_all("table", class_="tableRatio3")
    for table in detail_tables:
        h2 = table.find_previous("h2")
        전형명 = h2.get_text(strip=True) if h2 else "전형"

        rows = table.find_all("tr")[1:]  # 헤더 제외
        current_계열 = None  # rowspan 처리용

        for tr in rows:
            tds = tr.find_all("td")
            
            is_new_category = False
            if tds and tds[0].has_attr('rowspan'):
                current_계열 = tds[0].get_text(strip=True)
                is_new_category = True

            cols = [td.get_text(strip=True) for td in tds]

            if not cols:
                continue

            if is_new_category:
                if len(tds) >= 5:
                    학과, 모집, 지원, 경쟁률 = cols[1], cols[2], cols[3], cols[4]
                else: continue
            else:
                if len(tds) >= 4:
                    학과, 모집, 지원, 경쟁률 = cols[0], cols[1], cols[2], cols[3]
                else: continue

            if 학과 in ["합계", "계", "총계"]:
                continue

            result.append({
                "전형명": 전형명,
                "계열": current_계열,
                "학과": 학과,
                "모집인원": to_int(모집),
                "지원자수": to_int(지원),
                "경쟁률": to_float(경쟁률)
            })

    # 2. 특별 전형 (지원인원 현황) 테이블 크롤링
    special_header_text = soup.find(lambda tag: tag.name in ['h2', 'strong'] and '지원인원 현황(전문대졸, 북한이탈주민)' in tag.get_text(strip=True))
    
    special_table = None
    if special_header_text:
        special_table = special_header_text.find_next('table')

    if not special_table:
        special_table_header = soup.find('th', string=lambda t: t and '전문대졸' in t and '북한이탈주민' in t)
        if special_table_header:
            special_table = special_table_header.find_parent('table')
            
    if special_table:
        special_rows = special_table.find_all("tr")[1:] # 헤더 제외
        current_계열 = None

        for tr in special_rows:
            tds = tr.find_all("td")
            
            is_new_category = False
            if tds and tds[0].has_attr('rowspan'):
                current_계열 = tds[0].get_text(strip=True)
                is_new_category = True
            
            cols = [td.get_text(strip=True) for td in tds]

            if not cols:
                continue

            if is_new_category:
                if len(tds) >= 4:
                    학과, 전문대졸, 북한이탈주민 = cols[1], cols[2], cols[3]
                else: continue
            else:
                if len(tds) >= 3:
                    학과, 전문대졸, 북한이탈주민 = cols[0], cols[1], cols[2]
                else: continue

            if 학과 in ["합계", "계", "총계"]:
                continue
            
            전문대졸_int = to_int(전문대졸)
            북한이탈주민_int = to_int(북한이탈주민)

            result.append({
                "전형명": "특별전형", 
                "계열": current_계열,
                "학과": 학과,
                "모집인원": 0, # 특별전형은 모집인원이 '제한없음' 등이라 0으로 처리
                "지원자수": 전문대졸_int + 북한이탈주민_int, # 지원자수 필드에 합계를 저장
                "경쟁률": 0.0,
                "전문대졸": 전문대졸_int,
                "북한이탈주민": 북한이탈주민_int,
            })

    return {"data": result}


@app.get("/crawl/lastyear")
def crawl_last_year():
    try:
        res = requests.get(LAST_YEAR_URL)
        res.encoding = "euc-kr"
        soup = BeautifulSoup(res.text, "html.parser")
        result = []

        header = soup.find("th", string=lambda t: t and "전형명 · 모집단위" in t)
        if not header:
            print("Last year crawl: Header not found")
            return {"data": []}

        table = header.find_parent("table")
        if not table:
            print("Last year crawl: Table not found")
            return {"data": []}

        rows = table.select("tbody > tr")
        
        current_sigi = None
        current_hakgwa = None
        
        sigi_rowspan = 0
        hakgwa_rowspan = 0

        for row in rows:
            cells = row.find_all(["th", "td"])
            
            cell_cursor = 0
            
            # 1. '모집시기' (수시1) 추적
            if sigi_rowspan == 0:
                sigi_cell = cells[cell_cursor]
                cell_cursor += 1
                if sigi_cell.name == "th" and sigi_cell.has_attr("rowspan"):
                    current_sigi = sigi_cell.get_text(strip=True)
                    sigi_rowspan = int(sigi_cell.get("rowspan", 1))
                else:
                    current_sigi = sigi_cell.get_text(strip=True)
                    sigi_rowspan = 1
            sigi_rowspan -= 1
            
            if "수시1" not in (current_sigi or ""):
                continue

            # 2. '학과' (볼드체) 및 '전형명' 추적
            if hakgwa_rowspan == 0:
                hakgwa_cell = cells[cell_cursor]
                cell_cursor += 1
                if hakgwa_cell.has_attr("rowspan"):
                    hakgwa_rowspan = int(hakgwa_cell.get("rowspan", 1))
                else:
                    hakgwa_rowspan = 1
                
                strong_tag = hakgwa_cell.find("strong")
                if strong_tag:
                    current_hakgwa = strong_tag.get_text(strip=True)
                    strong_tag.decompose()
                
                전형명 = hakgwa_cell.get_text(strip=True)
            else:
                hakgwa_cell = cells[cell_cursor]
                cell_cursor += 1
                전형명 = hakgwa_cell.get_text(strip=True)
            
            hakgwa_rowspan -= 1

            if not current_hakgwa:
                continue
                
            # 3. 원하는 전형명인지 확인 및 데이터 추출
            if 전형명 in ["일반고", "특성화고", "특기자(어학)"]:
                try:
                    cell_mojip_jiwon = cells[cell_cursor]
                    cell_gyengjaeng = cells[cell_cursor + 2] # 경쟁률은 2칸 뒤
                    
                    numbers = [s.strip() for s in cell_mojip_jiwon.stripped_strings]
                    
                    모집 = "0"
                    지원 = "0"
                    
                    if len(numbers) >= 1:
                        모집 = numbers[0]
                    if len(numbers) >= 3: # 51<br>-<br>228 구조
                        지원 = numbers[2]
                    elif len(numbers) == 2: # 51<br>228 구조 (혹은 -가 빠진)
                        지원 = numbers[1]
                    elif len(numbers) == 1: # 지원자만 있는 경우
                         지원 = numbers[0]

                    경쟁 = cell_gyengjaeng.get_text(strip=True)

                    result.append({
                        "전형명": 전형명,
                        "계열": None,  # 이 페이지에서 계열 정보 수집 불가
                        "학과": current_hakgwa,
                        "모집인원": to_int(모집),
                        "지원자수": to_int(지원),
                        "경쟁률": to_float(경쟁)
                    })
                except IndexError:
                    print(f"Row parsing error for {current_hakgwa} - {전형명}")
                    continue

        return {"data": result}
    except Exception as e:
        print(f"Error in /crawl/lastyear: {e}")
        return {"data": []}

