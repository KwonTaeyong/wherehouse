import cv2
import pyzbar.pyzbar as pyzbar
from playsound import playsound
import VideoCapture
from cv2 import waitKey

data_list = []
used_codes = []

try:
    f = open('grbarcode_data.txt',"r", encoding="utf8")
    data_list = f.readlines()
except FileNotFoundError:
    pass
else:
    f.close()


cap = cv2.VideoCapture(0)

for i in data_list:
    used_codes.append(i.rsplit('\n'))

while True:
    success, frame = cap.read()

    if success:
        for code in pyzbar.decode(frame):
            my_code = code.data.decode('utf-8')
            if my_code not in used_codes:
                print("인식 성공 : ", my_code)
                playsound("짧은 비프.mp3")
                used_codes.append(my_code)

                f2 = open("grbarcode_data.txt", "a", encoding="utf8")
                f2.write(my_code+'\n')
                f2.close()
            else:
                print("이미 인식된 코드입니다")
                playsound("짧은 비프.mp3")

        cv2.imshow('cam', frame)

        key = cv2.waitKey(1)
        if key == 27:
            break

cap.release()
cv2.destroyAllWindows()