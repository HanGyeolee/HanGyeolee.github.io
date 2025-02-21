@echo off
cmd /c build.bat
cmd /c npm i -g serve
Rem 만약 웹서버를 배포하는 경우 다음과 같이 수정해야 한다.
Rem /c serve -l (포트 번호) -s (build 폴더 위치)
Rem build 폴더 위치는 .../etco/build 에 있다. 앞의 ... 부분은 현재 위치해 있는 폴더 상위 까지 모두 작성해야 한다.
cmd /c serve -l 4000 -s build