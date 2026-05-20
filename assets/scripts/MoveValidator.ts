import { QuanCo, LoaiQuan } from './Piece';

export type BanCoQuan = Array<Array<QuanCo | null>>;

export interface ViTriBanCo {
    hang: number;
    cot: number;
}

export class KiemTraNuocDi {

    public static layNuocDiHopLeAnToan(quanCo: QuanCo, banCo: BanCoQuan): ViTriBanCo[] {
        const cacNuocDi = this.layNuocDiHopLe(quanCo, banCo);

        return cacNuocDi.filter((nuocDi) => {
            return !this.nuocDiLamTuongBiChieu(quanCo, nuocDi, banCo);
        });
    }

    public static dangBiChieu(laQuanDo: boolean, banCo: BanCoQuan): boolean {
        const tuongSoai = this.timTuongSoai(laQuanDo, banCo);

        if (!tuongSoai) return true;

        for (const hangQuan of banCo) {
            for (const quanCo of hangQuan) {
                if (!quanCo || quanCo.laQuanDo === laQuanDo) continue;

                const cacNuocDiTanCong = this.layNuocDiHopLe(quanCo, banCo);
                const coTheAnTuong = cacNuocDiTanCong.some((nuocDi) => {
                    return nuocDi.hang === tuongSoai.hang && nuocDi.cot === tuongSoai.cot;
                });

                if (coTheAnTuong) return true;
            }
        }

        return false;
    }

    public static conNuocDiHopLe(laQuanDo: boolean, banCo: BanCoQuan): boolean {
        for (const hangQuan of banCo) {
            for (const quanCo of hangQuan) {
                if (!quanCo || quanCo.laQuanDo !== laQuanDo) continue;

                if (this.layNuocDiHopLeAnToan(quanCo, banCo).length > 0) {
                    return true;
                }
            }
        }

        return false;
    }

    public static layNuocDiHopLe(quanCo: QuanCo, banCo: BanCoQuan): ViTriBanCo[] {
        switch (quanCo.loaiQuan) {
            case LoaiQuan.TUONG_SOAI:
                return this.layNuocDiCuaTuongSoai(quanCo, banCo);
            case LoaiQuan.SI:
                return this.layNuocDiCuaSi(quanCo, banCo);
            case LoaiQuan.TUONG_VOI:
                return this.layNuocDiCuaTuongVoi(quanCo, banCo);
            case LoaiQuan.XE:
                return this.layNuocDiCuaXe(quanCo, banCo);
            case LoaiQuan.MA:
                return this.layNuocDiCuaMa(quanCo, banCo);
            case LoaiQuan.PHAO:
                return this.layNuocDiCuaPhao(quanCo, banCo);
            case LoaiQuan.TOT:
                return this.layNuocDiCuaTot(quanCo, banCo);
            default:
                return [];
        }
    }

    private static nuocDiLamTuongBiChieu(quanCo: QuanCo, nuocDi: ViTriBanCo, banCo: BanCoQuan): boolean {
        const hangCu = quanCo.hang;
        const cotCu = quanCo.cot;
        const quanBiAn = banCo[nuocDi.hang][nuocDi.cot];

        banCo[hangCu][cotCu] = null;
        banCo[nuocDi.hang][nuocDi.cot] = quanCo;
        quanCo.hang = nuocDi.hang;
        quanCo.cot = nuocDi.cot;

        const biChieu = this.dangBiChieu(quanCo.laQuanDo, banCo);

        quanCo.hang = hangCu;
        quanCo.cot = cotCu;
        banCo[hangCu][cotCu] = quanCo;
        banCo[nuocDi.hang][nuocDi.cot] = quanBiAn;

        return biChieu;
    }

    private static timTuongSoai(laQuanDo: boolean, banCo: BanCoQuan): QuanCo | null {
        for (const hangQuan of banCo) {
            for (const quanCo of hangQuan) {
                if (quanCo && quanCo.laQuanDo === laQuanDo && quanCo.loaiQuan === LoaiQuan.TUONG_SOAI) {
                    return quanCo;
                }
            }
        }

        return null;
    }

    private static layNuocDiCuaXe(quanCo: QuanCo, banCo: BanCoQuan): ViTriBanCo[] {
        return this.layNuocDiTheoDuongThang(quanCo, banCo, false);
    }

    private static layNuocDiCuaPhao(quanCo: QuanCo, banCo: BanCoQuan): ViTriBanCo[] {
        return this.layNuocDiTheoDuongThang(quanCo, banCo, true);
    }

    private static layNuocDiTheoDuongThang(quanCo: QuanCo, banCo: BanCoQuan, laPhao: boolean): ViTriBanCo[] {
        const danhSachNuocDi: ViTriBanCo[] = [];
        const cacHuongDi = [
            { hang: 1, cot: 0 },
            { hang: -1, cot: 0 },
            { hang: 0, cot: 1 },
            { hang: 0, cot: -1 }
        ];

        for (const huongDi of cacHuongDi) {
            let hang = quanCo.hang + huongDi.hang;
            let cot = quanCo.cot + huongDi.cot;
            let daGapQuanChan = false;

            while (this.namTrongBanCo(hang, cot, banCo)) {
                const quanTaiO = banCo[hang][cot];

                if (!laPhao) {
                    if (quanTaiO) {
                        if (quanTaiO.laQuanDo !== quanCo.laQuanDo) {
                            danhSachNuocDi.push({ hang, cot });
                        }
                        break;
                    }

                    danhSachNuocDi.push({ hang, cot });
                } else {
                    if (!daGapQuanChan) {
                        if (quanTaiO) {
                            daGapQuanChan = true;
                        } else {
                            danhSachNuocDi.push({ hang, cot });
                        }
                    } else if (quanTaiO) {
                        if (quanTaiO.laQuanDo !== quanCo.laQuanDo) {
                            danhSachNuocDi.push({ hang, cot });
                        }
                        break;
                    }
                }

                hang += huongDi.hang;
                cot += huongDi.cot;
            }
        }

        return danhSachNuocDi;
    }

    private static layNuocDiCuaMa(quanCo: QuanCo, banCo: BanCoQuan): ViTriBanCo[] {
        const danhSachNuocDi: ViTriBanCo[] = [];
        const cacNuocDi = [
            { hang: 2, cot: 1, chanHang: 1, chanCot: 0 },
            { hang: 2, cot: -1, chanHang: 1, chanCot: 0 },
            { hang: -2, cot: 1, chanHang: -1, chanCot: 0 },
            { hang: -2, cot: -1, chanHang: -1, chanCot: 0 },
            { hang: 1, cot: 2, chanHang: 0, chanCot: 1 },
            { hang: -1, cot: 2, chanHang: 0, chanCot: 1 },
            { hang: 1, cot: -2, chanHang: 0, chanCot: -1 },
            { hang: -1, cot: -2, chanHang: 0, chanCot: -1 }
        ];

        for (const nuocDi of cacNuocDi) {
            const hangChan = quanCo.hang + nuocDi.chanHang;
            const cotChan = quanCo.cot + nuocDi.chanCot;
            const hangMoi = quanCo.hang + nuocDi.hang;
            const cotMoi = quanCo.cot + nuocDi.cot;

            if (!this.namTrongBanCo(hangMoi, cotMoi, banCo)) continue;
            if (banCo[hangChan][cotChan]) continue;

            this.themNeuCoTheDi(quanCo, hangMoi, cotMoi, banCo, danhSachNuocDi);
        }

        return danhSachNuocDi;
    }

    private static layNuocDiCuaTuongVoi(quanCo: QuanCo, banCo: BanCoQuan): ViTriBanCo[] {
        const danhSachNuocDi: ViTriBanCo[] = [];
        const cacNuocDi = [
            { hang: 2, cot: 2 },
            { hang: 2, cot: -2 },
            { hang: -2, cot: 2 },
            { hang: -2, cot: -2 }
        ];

        for (const nuocDi of cacNuocDi) {
            const hangMoi = quanCo.hang + nuocDi.hang;
            const cotMoi = quanCo.cot + nuocDi.cot;
            const hangMat = quanCo.hang + nuocDi.hang / 2;
            const cotMat = quanCo.cot + nuocDi.cot / 2;

            if (!this.namTrongBanCo(hangMoi, cotMoi, banCo)) continue;
            if (!this.namBenMinh(quanCo, hangMoi)) continue;
            if (banCo[hangMat][cotMat]) continue;

            this.themNeuCoTheDi(quanCo, hangMoi, cotMoi, banCo, danhSachNuocDi);
        }

        return danhSachNuocDi;
    }

    private static layNuocDiCuaSi(quanCo: QuanCo, banCo: BanCoQuan): ViTriBanCo[] {
        const danhSachNuocDi: ViTriBanCo[] = [];
        const cacNuocDi = [
            { hang: 1, cot: 1 },
            { hang: 1, cot: -1 },
            { hang: -1, cot: 1 },
            { hang: -1, cot: -1 }
        ];

        for (const nuocDi of cacNuocDi) {
            const hangMoi = quanCo.hang + nuocDi.hang;
            const cotMoi = quanCo.cot + nuocDi.cot;

            if (!this.namTrongCung(quanCo, hangMoi, cotMoi)) continue;

            this.themNeuCoTheDi(quanCo, hangMoi, cotMoi, banCo, danhSachNuocDi);
        }

        return danhSachNuocDi;
    }

    private static layNuocDiCuaTuongSoai(quanCo: QuanCo, banCo: BanCoQuan): ViTriBanCo[] {
        const danhSachNuocDi: ViTriBanCo[] = [];
        const cacNuocDi = [
            { hang: 1, cot: 0 },
            { hang: -1, cot: 0 },
            { hang: 0, cot: 1 },
            { hang: 0, cot: -1 }
        ];

        for (const nuocDi of cacNuocDi) {
            const hangMoi = quanCo.hang + nuocDi.hang;
            const cotMoi = quanCo.cot + nuocDi.cot;

            if (!this.namTrongCung(quanCo, hangMoi, cotMoi)) continue;

            this.themNeuCoTheDi(quanCo, hangMoi, cotMoi, banCo, danhSachNuocDi);
        }

        const tuongDoiDien = this.timTuongDoiDien(quanCo, banCo);
        if (tuongDoiDien) {
            danhSachNuocDi.push({ hang: tuongDoiDien.hang, cot: tuongDoiDien.cot });
        }

        return danhSachNuocDi;
    }

    private static layNuocDiCuaTot(quanCo: QuanCo, banCo: BanCoQuan): ViTriBanCo[] {
        const danhSachNuocDi: ViTriBanCo[] = [];
        const huongTien = quanCo.laQuanDo ? 1 : -1;

        this.themNeuCoTheDi(quanCo, quanCo.hang + huongTien, quanCo.cot, banCo, danhSachNuocDi);

        if (this.daQuaSong(quanCo)) {
            this.themNeuCoTheDi(quanCo, quanCo.hang, quanCo.cot + 1, banCo, danhSachNuocDi);
            this.themNeuCoTheDi(quanCo, quanCo.hang, quanCo.cot - 1, banCo, danhSachNuocDi);
        }

        return danhSachNuocDi;
    }

    private static themNeuCoTheDi(
        quanCo: QuanCo,
        hang: number,
        cot: number,
        banCo: BanCoQuan,
        danhSachNuocDi: ViTriBanCo[]
    ) {
        if (!this.namTrongBanCo(hang, cot, banCo)) return;

        const quanTaiO = banCo[hang][cot];

        if (!quanTaiO || quanTaiO.laQuanDo !== quanCo.laQuanDo) {
            danhSachNuocDi.push({ hang, cot });
        }
    }

    private static timTuongDoiDien(quanCo: QuanCo, banCo: BanCoQuan): QuanCo | null {
        const huong = quanCo.laQuanDo ? 1 : -1;
        let hang = quanCo.hang + huong;

        while (this.namTrongBanCo(hang, quanCo.cot, banCo)) {
            const quanTaiO = banCo[hang][quanCo.cot];

            if (quanTaiO) {
                if (quanTaiO.loaiQuan === LoaiQuan.TUONG_SOAI && quanTaiO.laQuanDo !== quanCo.laQuanDo) {
                    return quanTaiO;
                }

                return null;
            }

            hang += huong;
        }

        return null;
    }

    private static namTrongCung(quanCo: QuanCo, hang: number, cot: number): boolean {
        if (cot < 3 || cot > 5) return false;

        if (quanCo.laQuanDo) {
            return hang >= 0 && hang <= 2;
        }

        return hang >= 7 && hang <= 9;
    }

    private static namBenMinh(quanCo: QuanCo, hang: number): boolean {
        if (quanCo.laQuanDo) {
            return hang >= 0 && hang <= 4;
        }

        return hang >= 5 && hang <= 9;
    }

    private static daQuaSong(quanCo: QuanCo): boolean {
        return quanCo.laQuanDo ? quanCo.hang >= 5 : quanCo.hang <= 4;
    }

    private static namTrongBanCo(hang: number, cot: number, banCo: BanCoQuan): boolean {
        return hang >= 0
            && hang < banCo.length
            && cot >= 0
            && cot < (banCo[hang]?.length ?? 0);
    }
}
