import sys
import os
import speech_recognition as sr
from pydub import AudioSegment
import math

def convert_to_wav(audio_path):
    ext = audio_path.rsplit('.', 1)[-1].lower()
    if ext != "wav":
        audio = AudioSegment.from_file(audio_path)
        audio = audio.set_frame_rate(16000).set_channels(1)
        wav_path = audio_path.rsplit('.', 1)[0] + '__converted.wav'
        audio.export(wav_path, format="wav")
        return wav_path
    return audio_path

def split_wav(wav_path, chunk_ms=60000):
    audio = AudioSegment.from_wav(wav_path)
    chunks = []
    for i in range(0, len(audio), chunk_ms):
        chunk = audio[i:i+chunk_ms]
        chunk_name = f"chunk_{i//chunk_ms}.wav"
        chunk.export(chunk_name, format="wav")
        chunks.append(chunk_name)
    return chunks

if __name__ == "__main__":
    input_audio = sys.argv[1]
    wav_path = convert_to_wav(input_audio)
    chunk_files = split_wav(wav_path)  # Split into 1-min chunks

    recognizer = sr.Recognizer()
    full_text = ""

    for chunk_file in chunk_files:
        with sr.AudioFile(chunk_file) as source:
            audio_data = recognizer.record(source)
            try:
                text = recognizer.recognize_google(audio_data)
            except sr.UnknownValueError:
                text = "Could not understand audio."
            except sr.RequestError as e:
                text = f"Google API error: {e}"
            full_text += text + "\n"
        os.remove(chunk_file)  # clean up

    print(full_text.strip())
    # Clean up converted file if it was created
    if wav_path != input_audio and os.path.exists(wav_path):
        os.remove(wav_path)
