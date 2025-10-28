import requests
from bs4 import BeautifulSoup
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import re
import json

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
    if val == "" or "제한없음" in val or "없음" in val or "-" in val:
        return 0
    val = val.replace(",", "")
    try:
        return int(val)
    except:
        return 0


def to_float(val: str) -> float:
    val = val.strip()
    if val == "" or "없음" in val or "-" in val:
        return 0.0
    try:
        # "8.11 : 1" 같은 형태에서 "8.11"만 추출
        return float(val.split(":")[0].strip())
    except:
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
        # '경쟁률 현황' 등 불필요한 텍스트 제거
        전형명 = 전형명.replace(" 경쟁률 현황", "").strip()


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
                    학과 = cols[1]
                    모집, 지원, 경쟁률 = cols[2:5]
                else: continue
            else:
                if len(tds) >= 4:
                    학과 = cols[0]
                    모집, 지원, 경쟁률 = cols[1:4]
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
                    학과 = cols[1]
                    전문대졸, 북한이탈주민 = cols[2:4] # 4번째 TD(합계)는 무시
                else: continue
            else:
                if len(tds) >= 3:
                    학과 = cols[0]
                    전문대졸, 북한이탈주민 = cols[1:3] # 3번째 TD(합계)는 무시
                else: continue

            if 학과 in ["합계", "계", "총계"]:
                continue
            
            전문대졸_int = to_int(전문대졸)
            북한이탈주민_int = to_int(북한이탈주민)

            result.append({
                "전형명": "특별전형", 
                "계열": current_계열,
                "학과": 학과,
                "모집인원": 0, # 특별전형은 모집인원이 '제한없음'
                "지원자수": 전문대졸_int + 북한이탈주민_int, # '지원자수' 필드에 합계
                "경쟁률": 0.0,
                "전문대졸": 전문대졸_int,
                "북한이탈주민": 북한이탈주민_int,
            })


    return {"data": result}

@app.get("/crawl/lastyear")
def crawl_last_year():
    try:
        res = requests.get(LAST_YEAR_URL)
        res.encoding = "utf-8"
        soup = BeautifulSoup(res.text, "html.parser")
        result = []

        # Find the script tag containing the data
        # "var sortedData =" 이 부분을 찾아 JSON 데이터를 추출
        script_tag = soup.find("script", string=re.compile(r"var\s+sortedData\s*=\s*\["))
        if not script_tag:
            print("Could not find sortedData script tag.")
            return {"data": []}

        script_content = script_tag.string
        
        # Extract the JSON array string
        json_match = re.search(r"var\s+sortedData\s*=\s*(\[.*\]);", script_content, re.DOTALL | re.MULTILINE)
        if not json_match:
            print("Could not extract sortedData JSON.")
            return {"data": []}

        json_data_str = json_match.group(1)
        
        # The JSON is slightly malformed (uses single quotes), so we need to clean it
        # 1. Replace single quotes in keys with double quotes
        json_data_str = re.sub(r"([{,]\s*)(')(\w+)(')(\s*:)", r'\1"\3"\5', json_data_str)
        # 2. Replace single quotes in values with double quotes
        json_data_str = re.sub(r"(\:\s*)(')(.*?)(')(\s*[,}])", r'\1"\3"\5', json_data_str)
        
        try:
            # Parse the cleaned JSON string
            data = json.loads(json_data_str)
        except json.JSONDecodeError as e:
            print(f"Failed to parse JSON: {e}")
            # Fallback for potentially unquoted keys if regex failed
            try:
                json_data_str = re.sub(r"([{,]\s*)(\w+)(\s*:)", r'\1"\2"\3', json_match.group(1))
                json_data_str = re.sub(r"(\:\s*)(')(.*?)(')(\s*[,}])", r'\1"\3"\5', json_data_str)
                data = json.loads(json_data_str)
            except Exception as e2:
                print(f"Final JSON parse attempt failed: {e2}")
                return {"data": []}

        # We have the data, now filter it
        target_types = ["일반고", "특성화고", "특기자(어학)"]
        
        for item in data:
            # 'Gubun'이 '수시1'인지 확인
            if item.get("Gubun") == "수시1" and item.get("SelTypeName") in target_types:
                result.append({
                    "전형명": item.get("SelTypeName"),
                    "계열": item.get("GyeYeol"),
                    "학과": item.get("MajorName"),
                    "모집인원": to_int(item.get("Mojip", "0")),
                    "지원자수": to_int(item.get("Jiwon", "0")),
                    "경쟁률": to_float(item.get("Ratio", "0"))
                })
            
        return {"data": result}
    except Exception as e:
        print(f"Error in crawl_last_year: {e}")
        return {"data": []}

