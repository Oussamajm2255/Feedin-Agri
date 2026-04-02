import chardet
import sys

def detect_encoding(path):
    with open(path, 'rb') as f:
        rawdata = f.read()
    print(chardet.detect(rawdata))

if __name__ == "__main__":
    detect_encoding(sys.argv[1])
