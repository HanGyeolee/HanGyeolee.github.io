// 이미지
import { ProjectProps } from '../../components/util/projects.ts';
import { IconType } from '../../components/util/icons.ts';
import keySignImage  from '../../image/key-sign.png'
import medicalPlatformImage  from '../../image/medical-platform.png'
import musicAppImage  from '../../image/music-app.png'
import emotionAIAppImage  from '../../image/emotion-ai-app.png'
import emgMiddlewareImage  from '../../image/emg-middleware.png'
import eogMusicComposeImage  from '../../image/eog-music-compose.png'
import restAPIImage  from '../../image/restapi-image.png'
import blackHoleImage  from '../../image/blackhole.png'

const ProjectList:ProjectProps[] = [
{
    title: '블랙홀 시뮬레이션',
    thumbnail: blackHoleImage,
    document: 'https://hangyeolee.github.io/#/projects/blackhole',
    type: IconType.PERSONAL,
    description: '레이 트레이싱을 활용한 블랙홀 중력 렌즈 시뮬레이션',
    techStack: ['React.js', 'Typescript', 'Three.js'],
    period: '2025.09'
},
{
    title: '동물용 기기 중앙 관리 서버',
    thumbnail: restAPIImage,
    type: IconType.COMPANY,
    description: '관리자 및 사용자 권한 기반 아키텍처 설계를 통한 동물용 기기 중앙 관리 서버 개발',
    techStack: ['Java', 'Kotlin', 'Spring Boot', 'CI/CD', 'MySQL', 'SMTP', 'HAProxy', 'Docker', 'Thymeleaf'],
    period: '2023.11 ~ 2025.07'
},
{
    title: '조성 검색 사이트',
    thumbnail: keySignImage,
    document: 'https://hangyeolee.github.io/#/projects/tonality',
    type: IconType.PERSONAL,
    description: '조성별 기능화성 진행을 시각화하여 제공하는 웹 기반 음악 이론 참조 시스템 구축',
    techStack: ['React.js', 'Javascript', 'Typescript'],
    period: '2025.03 ~ 2025.04'
},
{
    title: '안드로이드 PDF 라이브러리',
    document: 'apw-webui', //https://hangyeolee.github.io/#/projects/apw-webui
    type: IconType.PERSONAL | IconType.GITHUB,
    description: 'PDF 1.4 표준 준수 바이너리 파일 생성 라이브러리 개발 및 오픈소스 배포',
    techStack: ['Android', 'Java', 'Library', 'PDF', 'Binary', 'Maven'],
    period: '2024.11 ~'
},
{
    title: '생체 신호 시각화 어플리케이션',
    thumbnail: medicalPlatformImage,
    document: 'https://play.google.com/store/apps/details?id=com.neurowiztek.brainmeasure',
    type: IconType.COMPANY,
    description: '생체신호 기반 시각화 모바일 플랫폼 개발 및 구글 스토어 출시',
    techStack: ['Android', 'Java', 'Kotlin', 'MVVM', 'CI/CD', 'JNI', 'SIMD', 'DataBinding'],
    period: '2022.06 ~ 2023.11'
},
{
    title: '인공지능 다이어리 어플리케이션',
    thumbnail: emotionAIAppImage,
    type: IconType.TEAM,
    description: '자연어 처리 기반 감정 분석 AI 모델을 활용한 스마트 다이어리 애플리케이션 개발',
    techStack: ['Android', 'JAVA', 'Python', 'Pytorch', 'Tokenizer'],
    period: '2021.03 - 2021.06'
},
{
    title: 'EMG 활용 재활 치료 프로그램',
    thumbnail: emgMiddlewareImage,
    type: IconType.TEAM,
    description: 'EMG 신호 실시간 수집 및 디지털 신호 처리를 통한 HCI 미들웨어 시스템 개발. 재활 치료 게임과의 연동을 위한 키보드 입력 매핑 구현',
    techStack: ['Windows', 'C#', 'WinForm', 'Arduino', 'C'],
    period: '2021.03 - 2021.06'
},
{
    title: 'EOG 활용 음악 연주 프로그램',
    thumbnail: eogMusicComposeImage,
    type: IconType.TEAM,
    description: 'EOG 신호 기반 시선 추적을 활용한 비접촉식 HCI 시스템 설계. 접근성 향상을 위한 음악 연주 소프트웨어 개발',
    techStack: ['Windows', 'C#', 'WinForm', 'ARM', 'C'],
    period: '2020.08 - 2020.12'
},
{
    title: '음악 동아리 어플리케이션',
    thumbnail: musicAppImage,
    type: IconType.TEAM,
    description: '크로스 플랫폼 기반 대학 음악 동아리 전용 모바일 애플리케이션 개발 및 구글 스토어 출시. 서버 인프라 이슈로 인한 임시 서비스 중단 상태',
    techStack: ['Android', 'iOS', 'Xamarin', 'C#', 'Firebase'],
    period: '2019.01 - 2019.09'
},
].sort((a, b) => b.period.localeCompare(a.period));

const ProjectPage = () => {
    return (
        <div></div>
    )
}

export {ProjectList};

export default ProjectPage;