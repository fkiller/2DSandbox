@ECHO OFF

IF EXIST ".\cocos2d\scripts\%1.py" GOTO USE_COCOS
IF EXIST ".\scripts\%1.py" GOTO USE_SCRIPTS
GOTO UNKNOWN

:USE_COCOS
python ".\cocos2d\scripts\%1.py" "%2" "%3" "%4" "%5" "%6"

GOTO END

:USE_SCRIPTS
python ".\scripts\%1.py" "%2" "%3" "%4" "%5" "%6"

GOTO END

:UNKNOWN
ECHO "Unknown command : %1"

GOTO END

:END
