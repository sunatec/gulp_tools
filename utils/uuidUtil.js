/**
 * uuid工具
 * 
 */
export default function () {
    let Base64KeyChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

    let AsciiTo64 = new Array(128);
    for (let i = 0; i < 128; ++i) { AsciiTo64[i] = 0; }
    for (let i = 0; i < 64; ++i) { AsciiTo64[Base64KeyChars.charCodeAt(i)] = i; }

    let Reg_Dash = /-/g;
    let Reg_Uuid = /^[0-9a-fA-F-]{36}$/;
    let Reg_NormalizedUuid = /^[0-9a-fA-F]{32}$/;
    let Reg_CompressedUuid = /^[0-9a-zA-Z+/]{22,23}$/;

    let UuidUtils = {

        // 加了这个标记后，字符串就不可能会是 uuid 了。
        NonUuidMark: '.',

        // 压缩后的 uuid 可以减小保存时的尺寸，但不能做为文件名（因为无法区分大小写并且包含非法字符）。
        // 默认将 uuid 的后面 27 位压缩成 18 位，前 5 位保留下来，方便调试。
        // fc991dd7-0033-4b80-9d41-c8a86a702e59 -> fc9913XADNLgJ1ByKhqcC5Z
        // 如果启用 min 则将 uuid 的后面 30 位压缩成 20 位，前 2 位保留不变。
        // fc991dd7-0033-4b80-9d41-c8a86a702e59 -> fcmR3XADNLgJ1ByKhqcC5Z
        compressUuid: function (uuid, min) {
            if (Reg_Uuid.test(uuid)) {
                uuid = uuid.replace(Reg_Dash, '');
            }
            else if (!Reg_NormalizedUuid.test(uuid)) {
                return uuid;
            }
            let reserved = (min === true) ? 2 : 5;
            return UuidUtils.compressHex(uuid, reserved);
        },

        compressHex: function (hexString, reservedHeadLength) {
            let length = hexString.length;
            let i;
            if (typeof reservedHeadLength !== 'undefined') {
                i = reservedHeadLength;
            }
            else {
                i = length % 3;
            }
            let head = hexString.slice(0, i);
            let base64Chars = [];
            while (i < length) {
                let hexVal1 = parseInt(hexString[i], 16);
                let hexVal2 = parseInt(hexString[i + 1], 16);
                let hexVal3 = parseInt(hexString[i + 2], 16);
                base64Chars.push(Base64KeyChars[(hexVal1 << 2) | (hexVal2 >> 2)]);
                base64Chars.push(Base64KeyChars[((hexVal2 & 3) << 4) | hexVal3]);
                i += 3;
            }
            return head + base64Chars.join('');
        },
        //解压缩
        decompressUuid: function (str) {
            if (str.length === 23) {
                // decode base64
                let hexChars = [];
                for (let i = 5; i < 23; i += 2) {
                    let lhs = AsciiTo64[str.charCodeAt(i)];
                    let rhs = AsciiTo64[str.charCodeAt(i + 1)];
                    hexChars.push((lhs >> 2).toString(16));
                    hexChars.push((((lhs & 3) << 2) | rhs >> 4).toString(16));
                    hexChars.push((rhs & 0xF).toString(16));
                }
                //
                str = str.slice(0, 5) + hexChars.join('');
            }
            else if (str.length === 22) {
                // decode base64
                let hexChars = [];
                for (let i = 2; i < 22; i += 2) {
                    let lhs = AsciiTo64[str.charCodeAt(i)];
                    let rhs = AsciiTo64[str.charCodeAt(i + 1)];
                    hexChars.push((lhs >> 2).toString(16));
                    hexChars.push((((lhs & 3) << 2) | rhs >> 4).toString(16));
                    hexChars.push((rhs & 0xF).toString(16));
                }
                //
                str = str.slice(0, 2) + hexChars.join('');
            }
            return [str.slice(0, 8), str.slice(8, 12), str.slice(12, 16), str.slice(16, 20), str.slice(20)].join('-');
        },

        isUuid: function (str) {
            if (typeof str == 'string') {
                return Reg_CompressedUuid.test(str) || Reg_NormalizedUuid.test(str) || Reg_Uuid.test(str);
            } else {
                return false;
            }
        }
    };

    // let newUuid1 = UuidUtils.compressUuid("55a49ca0-7325-483e-93f5-8c3904903629", true);
    // console.log(newUuid1);
    // let newUuid2 = UuidUtils.compressUuid("55a49ca0-7325-483e-93f5-8c3904903629", false);
    // console.log(newUuid2);
    return UuidUtils;
}