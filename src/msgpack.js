import msgpack from 'msgpack-lite';

const MSGPACK_CODEC = msgpack.createCodec({
	binarraybuffer: true,
	preset: true
});

MSGPACK_CODEC.addExtUnpacker(0x3F, (value) => {
	return msgpack.decode(value);
});

export function encode(data, binary) {
	return msgpack.encode(data, {codec: MSGPACK_CODEC}).buffer;
}

export function decode(data) {
	return msgpack.decode(new Uint8Array(data), {codec: MSGPACK_CODEC});
}

export const codec = MSGPACK_CODEC;