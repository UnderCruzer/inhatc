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
# 전년도 URL 업데이트
LAST_YEAR_URL = "https://addon.jinhakapply.com/RatioV1/RatioH/Ratio41260361.html"


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
        # 경쟁률 형식 "8.11 : 1" 에서 숫자 부분만 추출
        rate_part = val.split(":")[0].strip()
        return float(rate_part)
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
        # "지원인원 현황" 같은 불필요한 텍스트 제거
        if "지원인원 현황" in 전형명:
            continue

        rows = table.find_all("tr")[1:]  # 헤더 제외
        current_계열 = None  # rowspan 처리용

        for tr in rows:
            tds = tr.find_all("td")

            is_new_category = False
            # rowspan이 있는 첫 번째 td가 계열
            if tds and tds[0].has_attr('rowspan'):
                current_계열 = tds[0].get_text(strip=True)
                is_new_category = True
                # 계열 td 제외하고 나머지 td 가져오기
                data_tds = tds[1:]
            elif tds:
                # rowspan이 없는 경우, 계열은 이전 값 사용, 모든 td가 데이터 td
                data_tds = tds
            else:
                continue # 빈 행 스킵

            cols = [td.get_text(strip=True) for td in data_tds]

            if not cols:
                continue

            # 예상 컬럼: 학과, 모집, 지원, 경쟁률
            if len(cols) >= 4:
                학과, 모집, 지원, 경쟁률 = cols[0], cols[1], cols[2], cols[3]
            else:
                # 예상치 못한 구조 스킵
                print(f"Skipping row with unexpected column count in {전형명}: {cols}")
                continue

            # 집계 행 스킵
            if 학과 in ["합계", "계", "총계", "소계"]:
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
    # h2 태그 또는 strong 태그에서 제목 찾기
    special_header = soup.find(lambda tag: tag.name in ['h2', 'strong'] and '지원인원 현황(전문대졸, 북한이탈주민)' in tag.get_text(strip=True))

    special_table = None
    if special_header:
        # 헤더 바로 다음에 오는 테이블 찾기
        special_table = special_header.find_next_sibling('table')
        # 만약 바로 다음이 테이블이 아니면, 다음 테이블을 찾음 (페이지 구조 변동 대비)
        if not special_table or special_table.name != 'table':
            special_table = special_header.find_next('table')

    # 만약 위 방식으로 못 찾으면, th 내용으로 테이블 찾기 시도
    if not special_table:
        th_header = soup.find('th', string=lambda t: t and '전문대졸' in t and '북한이탈주민' in t)
        if th_header:
            special_table = th_header.find_parent('table')

    if special_table:
        special_rows = special_table.find_all("tr")[1:] # 헤더 제외
        current_계열 = None

        for tr in special_rows:
            tds = tr.find_all("td")

            is_new_category = False
            if tds and tds[0].has_attr('rowspan'):
                current_계열 = tds[0].get_text(strip=True)
                is_new_category = True
                data_tds = tds[1:]
            elif tds:
                data_tds = tds
            else:
                continue

            cols = [td.get_text(strip=True) for td in data_tds]

            if not cols:
                continue

            # 예상 컬럼: 학과, 전문대졸, 북한이탈주민
            if len(cols) >= 3:
                학과, 전문대졸, 북한이탈주민 = cols[0], cols[1], cols[2]
            else:
                print(f"Skipping row with unexpected column count in Special Enrollment: {cols}")
                continue

            if 학과 in ["합계", "계", "총계", "소계"]:
                continue

            전문대졸_int = to_int(전문대졸)
            북한이탈주민_int = to_int(북한이탈주민)

            result.append({
                "전형명": "특별전형", # 고정값
                "계열": current_계열,
                "학과": 학과,
                "모집인원": 0, # 특별전형은 모집인원 정보가 없을 수 있음
                "지원자수": 전문대졸_int + 북한이탈주민_int, # 두 필드를 합쳐서 기본 지원자수로 사용
                "경쟁률": 0.0, # 경쟁률 정보 없음
                "전문대졸": 전문대졸_int,
                "북한이탈주민": 북한이탈주민_int,
            })
    else:
        print("Special enrollment table not found.")


    return {"data": result}


# 전년도 데이터 크롤링 함수 (새 URL 기반)
@app.get("/crawl/lastyear")
def crawl_last_year():
    try:
        res = requests.get(LAST_YEAR_URL)
        res.raise_for_status() # HTTP 오류 체크
        res.encoding = "utf-8" # 인코딩 utf-8로 변경 시도
        soup = BeautifulSoup(res.text, "html.parser")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching last year data: {e}")
        return {"data": []}
    except Exception as e:
        print(f"Error parsing last year data: {e}")
        return {"data": []}


    result = []

    # 새 URL 구조에 맞춰 테이블 찾기 (기존 tableRatio3 과 동일하다고 가정)
    detail_tables = soup.find_all("table", class_="tableRatio3")
    if not detail_tables:
        print("No tableRatio3 found in last year data page.")
        # 다른 테이블 클래스나 구조를 찾아야 할 수 있음
        # 예: dept_tables = soup.select("table.some-other-class")

    for table in detail_tables:
        h2 = table.find_previous("h2")
        전형명 = h2.get_text(strip=True) if h2 else "전형_작년" # 작년 데이터임을 구분
        if "지원인원 현황" in 전형명: # 특별전형 테이블 스킵
            continue

        rows = table.find_all("tr")[1:]  # 헤더 제외
        current_계열 = None

        for tr in rows:
            tds = tr.find_all("td")

            is_new_category = False
            if tds and tds[0].has_attr('rowspan'):
                current_계열 = tds[0].get_text(strip=True)
                is_new_category = True
                data_tds = tds[1:]
            elif tds:
                data_tds = tds
            else:
                continue

            cols = [td.get_text(strip=True) for td in data_tds]

            if not cols:
                continue

            if len(cols) >= 4:
                학과, 모집, 지원, 경쟁률 = cols[0], cols[1], cols[2], cols[3]
            else:
                print(f"Skipping row (last year) with unexpected column count in {전형명}: {cols}")
                continue

            if 학과 in ["합계", "계", "총계", "소계"]:
                continue

            result.append({
                "전형명": 전형명, # 여기서 가져온 전형명 사용
                "계열": current_계열,
                "학과": 학과,
                "모집인원": to_int(모집),
                "지원자수": to_int(지원),
                "경쟁률": to_float(경쟁률)
            })

    return {"data": result}
