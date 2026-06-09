import {
    _decorator,
    Component,
    Prefab,
    Vec3,
    Camera,
    input,
    Input,
    EventMouse,
    EventKeyboard,
    KeyCode,
    find,
    Node,
    Label,
    UITransform,
    Color,
    HorizontalTextAlignment,
    VerticalTextAlignment,
    Canvas,
    view,
    Overflow,
    Layers,
    Graphics,
    Sprite,
    SpriteFrame,
    Texture2D,
    resources
} from 'cc';

import { QuanCo, LoaiQuan } from './Piece';
import { KiemTraNuocDi, BanCoQuan, ViTriBanCo } from './MoveValidator';

const { ccclass, property } = _decorator;

interface CauHinhQuanCo {
    hang: number;
    cot: number;
    loaiQuan: LoaiQuan;
    laQuanDo: boolean;
}

interface NuocDiMay {
    quanCo: QuanCo;
    hang: number;
    cot: number;
    quanBiAn: QuanCo | null;
}

@ccclass('QuanLyBanCo')
export class QuanLyBanCo extends Component {

    @property(Prefab)
    prefabOCo: Prefab | null = null;

    @property(Prefab)
    prefabQuanCo: Prefab | null = null;

    @property(Camera)
    cameraChinh: Camera | null = null;

    private quanDangChon: QuanCo | null = null;
    private cacONuocDiHopLe: ViTriBanCo[] = [];
    private banCoQuan: BanCoQuan = [];
    private danhSachQuanCo: QuanCo[] = [];
    private luotQuanDo = true;
    private vanDaKetThuc = false;
    private nhanTrangThai: Label | null = null;
    private mayDangDi = false;
    private nodeCanvas: Node | null = null;
    private cameraCanvas: Camera | null = null;
    private nodeBanCo2D: Node | null = null;
    private veBanCo2D: Graphics | null = null;
    private veHighlight2D: Graphics | null = null;
    private nodeQuanCo2D: Node | null = null;
    private cacNodeQuanCo: Map<QuanCo, Node> = new Map();
    private hangOCoDangChon: number | null = null;
    private cotOCoDangChon: number | null = null;

    private readonly soHang = 10;
    private readonly soCot = 9;
    private readonly canhOCo = 90;
    private readonly leBanCo = 44;
    private readonly tiLePhongNgangBanCo = 1.14;
    private readonly choiVoiMay = true;
    private readonly mayLaQuanDo = false;
    private readonly dungAnhBanCo = true;

    start() {
        this.anCacNode3DCu();
        this.timCameraChinhNeuCan();
        this.taoGiaoDien2D();
        this.taoBanCo();
        this.taoCacQuanCoBanDau();
        this.veLaiBanCo();
        this.inLuotHienTai();
        input.on(Input.EventType.MOUSE_DOWN, this.khiBamChuot, this);
        input.on(Input.EventType.KEY_DOWN, this.khiBamPhim, this);
    }

    onDestroy() {
        input.off(Input.EventType.MOUSE_DOWN, this.khiBamChuot, this);
        input.off(Input.EventType.KEY_DOWN, this.khiBamPhim, this);

        if (this.nodeCanvas && this.nodeCanvas.isValid) {
            this.nodeCanvas.off(Node.EventType.MOUSE_DOWN, this.khiBamChuot, this);
        }

        if (this.nodeCanvas && this.nodeCanvas.isValid) {
            this.nodeCanvas.destroy();
        }

        this.nodeCanvas = null;
        this.cameraCanvas = null;
        this.nodeBanCo2D = null;
        this.veBanCo2D = null;
        this.veHighlight2D = null;
        this.nodeQuanCo2D = null;
        this.cacNodeQuanCo.clear();
    }

    private anCacNode3DCu() {
        for (const nodeCon of this.node.children) {
            nodeCon.active = false;
        }
    }

    private timCameraChinhNeuCan() {
        if (!this.cameraChinh) {
            const nodeCamera = find('Main Camera');
            this.cameraChinh = nodeCamera?.getComponent(Camera) ?? null;
        }

        if (this.cameraChinh) {
            this.cameraChinh.node.active = false;
        }
    }

    private taoGiaoDien2D() {
        const kichThuocManHinh = view.getVisibleSize();

        this.nodeCanvas = new Node('CanvasCoTuong2D');
        this.nodeCanvas.layer = Layers.Enum.UI_2D;
        this.node.scene?.addChild(this.nodeCanvas);

        const transformCanvas = this.nodeCanvas.addComponent(UITransform);
        transformCanvas.setContentSize(kichThuocManHinh.width, kichThuocManHinh.height);
        this.nodeCanvas.setPosition(new Vec3(kichThuocManHinh.width / 2, kichThuocManHinh.height / 2, 0));

        const nodeCameraCanvas = new Node('CameraCoTuong2D');
        nodeCameraCanvas.layer = Layers.Enum.UI_2D;
        this.nodeCanvas.addChild(nodeCameraCanvas);

        this.cameraCanvas = nodeCameraCanvas.addComponent(Camera);
        this.cameraCanvas.projection = Camera.ProjectionType.ORTHO;
        this.cameraCanvas.visibility = Layers.Enum.UI_2D;
        this.cameraCanvas.clearFlags = Camera.ClearFlag.SOLID_COLOR;
        this.cameraCanvas.clearColor = new Color(32, 36, 42, 255);
        this.cameraCanvas.priority = 1;

        const canvas = this.nodeCanvas.addComponent(Canvas);
        canvas.cameraComponent = this.cameraCanvas;
        canvas.alignCanvasWithScreen = true;

        this.taoNodeTrangThai(kichThuocManHinh.height);
        this.taoNodeBanCo(kichThuocManHinh);
    }

    private taoNodeTrangThai(chieuCaoManHinh: number) {
        const nodeTrangThai = new Node('TrangThaiVanCo2D');
        nodeTrangThai.layer = Layers.Enum.UI_2D;
        nodeTrangThai.setPosition(new Vec3(0, chieuCaoManHinh / 2 - 34, 0));
        this.nodeCanvas!.addChild(nodeTrangThai);

        const transform = nodeTrangThai.addComponent(UITransform);
        transform.setContentSize(1180, 72);

        this.nhanTrangThai = nodeTrangThai.addComponent(Label);
        this.nhanTrangThai.fontSize = 26;
        this.nhanTrangThai.lineHeight = 30;
        this.nhanTrangThai.horizontalAlign = HorizontalTextAlignment.CENTER;
        this.nhanTrangThai.verticalAlign = VerticalTextAlignment.CENTER;
        this.nhanTrangThai.overflow = Overflow.SHRINK;
        this.nhanTrangThai.enableWrapText = false;
        this.nhanTrangThai.color = new Color(245, 236, 210, 255);
        this.nhanTrangThai.isBold = true;
    }

    private taoNodeBanCo(kichThuocManHinh: { width: number, height: number }) {
        const rongBanCo = this.chieuRongBanCo();
        const caoBanCo = this.chieuCaoBanCo();
        const tyLe = Math.min(
            (kichThuocManHinh.width * 0.98) / rongBanCo,
            (kichThuocManHinh.height * 0.94) / caoBanCo
        );

        this.nodeBanCo2D = new Node('BanCo2D');
        this.nodeBanCo2D.layer = Layers.Enum.UI_2D;
        this.nodeBanCo2D.setScale(new Vec3(tyLe * this.tiLePhongNgangBanCo, tyLe, 1));
        this.nodeBanCo2D.setPosition(new Vec3(0, -8, 0));
        this.nodeCanvas!.addChild(this.nodeBanCo2D);

        const transformBanCo = this.nodeBanCo2D.addComponent(UITransform);
        transformBanCo.setContentSize(rongBanCo, caoBanCo);

        this.veBanCo2D = this.nodeBanCo2D.addComponent(Graphics);

        if (this.dungAnhBanCo) {
            this.taoAnhNenBanCo(rongBanCo, caoBanCo);
        }

        const nodeHighlight = new Node('Highlight2D');
        nodeHighlight.layer = Layers.Enum.UI_2D;
        this.nodeBanCo2D.addChild(nodeHighlight);
        nodeHighlight.addComponent(UITransform).setContentSize(rongBanCo, caoBanCo);
        this.veHighlight2D = nodeHighlight.addComponent(Graphics);

        this.nodeQuanCo2D = new Node('QuanCo2D');
        this.nodeQuanCo2D.layer = Layers.Enum.UI_2D;
        this.nodeBanCo2D.addChild(this.nodeQuanCo2D);
        this.nodeQuanCo2D.addComponent(UITransform).setContentSize(rongBanCo, caoBanCo);
    }

    private taoAnhNenBanCo(rongBanCo: number, caoBanCo: number) {
        const nodeAnh = new Node('AnhNenBanCo');
        nodeAnh.layer = Layers.Enum.UI_2D;
        this.nodeBanCo2D!.addChild(nodeAnh);

        const transformAnh = nodeAnh.addComponent(UITransform);
        transformAnh.setContentSize(rongBanCo, caoBanCo);

        const sprite = nodeAnh.addComponent(Sprite);
        sprite.sizeMode = Sprite.SizeMode.CUSTOM;

        resources.load('board/texture', Texture2D, (loi, texture) => {
            if (loi || !texture) {
                console.error('Khong load duoc anh ban co:', loi);
                return;
            }

            const spriteFrame = new SpriteFrame();
            spriteFrame.texture = texture;
            sprite.spriteFrame = spriteFrame;
        });
    }

    private taoBanCo() {
        this.banCoQuan = [];

        for (let hang = 0; hang < this.soHang; hang++) {
            this.banCoQuan[hang] = [];

            for (let cot = 0; cot < this.soCot; cot++) {
                this.banCoQuan[hang][cot] = null;
            }
        }
    }

    private taoCacQuanCoBanDau() {
        const cacQuanCo: CauHinhQuanCo[] = [
            { hang: 0, cot: 0, loaiQuan: LoaiQuan.XE, laQuanDo: true },
            { hang: 0, cot: 1, loaiQuan: LoaiQuan.MA, laQuanDo: true },
            { hang: 0, cot: 2, loaiQuan: LoaiQuan.TUONG_VOI, laQuanDo: true },
            { hang: 0, cot: 3, loaiQuan: LoaiQuan.SI, laQuanDo: true },
            { hang: 0, cot: 4, loaiQuan: LoaiQuan.TUONG_SOAI, laQuanDo: true },
            { hang: 0, cot: 5, loaiQuan: LoaiQuan.SI, laQuanDo: true },
            { hang: 0, cot: 6, loaiQuan: LoaiQuan.TUONG_VOI, laQuanDo: true },
            { hang: 0, cot: 7, loaiQuan: LoaiQuan.MA, laQuanDo: true },
            { hang: 0, cot: 8, loaiQuan: LoaiQuan.XE, laQuanDo: true },
            { hang: 2, cot: 1, loaiQuan: LoaiQuan.PHAO, laQuanDo: true },
            { hang: 2, cot: 7, loaiQuan: LoaiQuan.PHAO, laQuanDo: true },
            { hang: 3, cot: 0, loaiQuan: LoaiQuan.TOT, laQuanDo: true },
            { hang: 3, cot: 2, loaiQuan: LoaiQuan.TOT, laQuanDo: true },
            { hang: 3, cot: 4, loaiQuan: LoaiQuan.TOT, laQuanDo: true },
            { hang: 3, cot: 6, loaiQuan: LoaiQuan.TOT, laQuanDo: true },
            { hang: 3, cot: 8, loaiQuan: LoaiQuan.TOT, laQuanDo: true },

            { hang: 9, cot: 0, loaiQuan: LoaiQuan.XE, laQuanDo: false },
            { hang: 9, cot: 1, loaiQuan: LoaiQuan.MA, laQuanDo: false },
            { hang: 9, cot: 2, loaiQuan: LoaiQuan.TUONG_VOI, laQuanDo: false },
            { hang: 9, cot: 3, loaiQuan: LoaiQuan.SI, laQuanDo: false },
            { hang: 9, cot: 4, loaiQuan: LoaiQuan.TUONG_SOAI, laQuanDo: false },
            { hang: 9, cot: 5, loaiQuan: LoaiQuan.SI, laQuanDo: false },
            { hang: 9, cot: 6, loaiQuan: LoaiQuan.TUONG_VOI, laQuanDo: false },
            { hang: 9, cot: 7, loaiQuan: LoaiQuan.MA, laQuanDo: false },
            { hang: 9, cot: 8, loaiQuan: LoaiQuan.XE, laQuanDo: false },
            { hang: 7, cot: 1, loaiQuan: LoaiQuan.PHAO, laQuanDo: false },
            { hang: 7, cot: 7, loaiQuan: LoaiQuan.PHAO, laQuanDo: false },
            { hang: 6, cot: 0, loaiQuan: LoaiQuan.TOT, laQuanDo: false },
            { hang: 6, cot: 2, loaiQuan: LoaiQuan.TOT, laQuanDo: false },
            { hang: 6, cot: 4, loaiQuan: LoaiQuan.TOT, laQuanDo: false },
            { hang: 6, cot: 6, loaiQuan: LoaiQuan.TOT, laQuanDo: false },
            { hang: 6, cot: 8, loaiQuan: LoaiQuan.TOT, laQuanDo: false }
        ];

        for (const cauHinh of cacQuanCo) {
            this.taoMotQuanCo(cauHinh);
        }
    }

    private taoMotQuanCo(cauHinh: CauHinhQuanCo) {
        const nodeQuan = new Node(this.layTenQuanCoNgan(cauHinh.loaiQuan, cauHinh.laQuanDo));
        nodeQuan.layer = Layers.Enum.UI_2D;
        this.nodeQuanCo2D!.addChild(nodeQuan);

        const transform = nodeQuan.addComponent(UITransform);
        transform.setContentSize(this.canhOCo * 1.25, this.canhOCo * 1.25);

        nodeQuan.addComponent(Graphics);

        const nodeChu = new Node('TenQuan');
        nodeChu.layer = Layers.Enum.UI_2D;
        nodeQuan.addChild(nodeChu);
        nodeChu.addComponent(UITransform).setContentSize(this.canhOCo * 1.18, this.canhOCo * 1.18);

        const label = nodeChu.addComponent(Label);
        label.string = this.layTenQuanCoNgan(cauHinh.loaiQuan, cauHinh.laQuanDo);
        label.fontSize = cauHinh.loaiQuan === LoaiQuan.TUONG_SOAI ? 38 : 42;
        label.lineHeight = 46;
        label.horizontalAlign = HorizontalTextAlignment.CENTER;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.overflow = Overflow.SHRINK;
        label.enableWrapText = false;
        label.isBold = true;

        const quanCo = nodeQuan.addComponent(QuanCo);
        quanCo.khoiTao(cauHinh.hang, cauHinh.cot, cauHinh.loaiQuan, cauHinh.laQuanDo);

        this.banCoQuan[cauHinh.hang][cauHinh.cot] = quanCo;
        this.danhSachQuanCo.push(quanCo);
        this.cacNodeQuanCo.set(quanCo, nodeQuan);
        this.capNhatHienThiQuanCo(quanCo);
    }

    private khiBamChuot(suKien: EventMouse) {
        if (this.vanDaKetThuc) return;
        if (this.laLuotCuaMay()) return;

        const viTriChuot = suKien.getLocation();
        const viTri = this.layViTriBanCoTuManHinh(viTriChuot.x, viTriChuot.y);
        if (!viTri) return;

        const quanCo = this.banCoQuan[viTri.hang][viTri.cot];

        if (quanCo) {
            if (this.coTheAnQuanDangBam(quanCo)) {
                this.anQuanVaDiChuyen(quanCo);
                return;
            }

            this.chonQuanCo(quanCo);
            return;
        }

        this.thuDiChuyenQuanDangChon(viTri);
    }

    private khiBamPhim(suKien: EventKeyboard) {
        if (suKien.keyCode === KeyCode.KEY_R) {
            this.datLaiVanCo();
        }
    }

    private chonQuanCo(quanCo: QuanCo) {
        if (quanCo.laQuanDo !== this.luotQuanDo) {
            console.log(`Chua den luot ${this.layTenPhe(quanCo.laQuanDo)}`);
            return;
        }

        this.xoaHighlightNuocDi();

        if (this.quanDangChon && this.quanDangChon !== quanCo) {
            this.capNhatHienThiQuanCo(this.quanDangChon);
        }

        this.quanDangChon = quanCo;
        console.log(`Da chon ${this.layTenQuanCo(quanCo)} tai hang=${quanCo.hang}, cot=${quanCo.cot}`);

        this.hienCacNuocDiHopLe(quanCo);
        this.veLaiBanCo();
    }

    private thuDiChuyenQuanDangChon(viTri: ViTriBanCo) {
        if (!this.quanDangChon) return;
        if (!this.laONuocDiHopLe(viTri)) return;

        this.diChuyenQuanDangChonDen(viTri);
    }

    private coTheAnQuanDangBam(quanBiAn: QuanCo): boolean {
        if (!this.quanDangChon) return false;
        if (this.quanDangChon === quanBiAn) return false;
        if (this.quanDangChon.laQuanDo === quanBiAn.laQuanDo) return false;

        return this.laONuocDiHopLe({ hang: quanBiAn.hang, cot: quanBiAn.cot });
    }

    private anQuanVaDiChuyen(quanBiAn: QuanCo) {
        console.log(`${this.layTenQuanCo(this.quanDangChon!)} an ${this.layTenQuanCo(quanBiAn)}`);
        this.xoaQuanCo(quanBiAn);
        this.diChuyenQuanDangChonDen({ hang: quanBiAn.hang, cot: quanBiAn.cot });
    }

    private diChuyenQuanDangChonDen(viTri: ViTriBanCo) {
        if (!this.quanDangChon) return;

        const quanCo = this.quanDangChon;

        this.banCoQuan[quanCo.hang][quanCo.cot] = null;
        this.banCoQuan[viTri.hang][viTri.cot] = quanCo;

        quanCo.hang = viTri.hang;
        quanCo.cot = viTri.cot;
        this.capNhatHienThiQuanCo(quanCo);

        this.quanDangChon = null;
        this.xoaHighlightNuocDi();
        this.hangOCoDangChon = viTri.hang;
        this.cotOCoDangChon = viTri.cot;
        this.veLaiBanCo();
        this.doiLuotSauKhiDi();
    }

    private hienCacNuocDiHopLe(quanCo: QuanCo) {
        this.cacONuocDiHopLe = KiemTraNuocDi.layNuocDiHopLeAnToan(quanCo, this.banCoQuan);
        this.hangOCoDangChon = quanCo.hang;
        this.cotOCoDangChon = quanCo.cot;
    }

    private doiLuotSauKhiDi() {
        this.luotQuanDo = !this.luotQuanDo;

        const dangBiChieu = KiemTraNuocDi.dangBiChieu(this.luotQuanDo, this.banCoQuan);
        const conNuocDi = KiemTraNuocDi.conNuocDiHopLe(this.luotQuanDo, this.banCoQuan);

        if (dangBiChieu && !conNuocDi) {
            this.vanDaKetThuc = true;
            this.capNhatTrangThai(`Chieu het. ${this.layTenPhe(!this.luotQuanDo)} thang!`);
            return;
        }

        if (!dangBiChieu && !conNuocDi) {
            this.vanDaKetThuc = true;
            this.capNhatTrangThai(`${this.layTenPhe(this.luotQuanDo)} het nuoc di. Van co ket thuc.`);
            return;
        }

        if (dangBiChieu) {
            this.capNhatTrangThai(`Chieu tuong ${this.layTenPhe(this.luotQuanDo)}`);
            this.yeuCauMayDiNeuCan();
            return;
        }

        this.inLuotHienTai();
        this.yeuCauMayDiNeuCan();
    }

    private datLaiVanCo() {
        this.xoaHighlightNuocDi();
        this.quanDangChon = null;
        this.hangOCoDangChon = null;
        this.cotOCoDangChon = null;

        for (const quanCo of this.danhSachQuanCo) {
            this.xoaQuanCo(quanCo);
        }

        this.danhSachQuanCo = [];
        this.cacNodeQuanCo.clear();
        this.taoBanCo();

        this.luotQuanDo = true;
        this.vanDaKetThuc = false;
        this.mayDangDi = false;
        this.taoCacQuanCoBanDau();
        this.veLaiBanCo();
        this.capNhatTrangThai('Da reset van co');
        this.inLuotHienTai();
    }

    private inLuotHienTai() {
        this.capNhatTrangThai(`Luot ${this.layTenPhe(this.luotQuanDo)}`);
    }

    private capNhatTrangThai(noiDung: string) {
        console.log(noiDung);

        if (this.nhanTrangThai) {
            this.nhanTrangThai.string = `${noiDung} | R: choi lai`;
        }
    }

    private laLuotCuaMay(): boolean {
        return this.choiVoiMay && this.luotQuanDo === this.mayLaQuanDo;
    }

    private yeuCauMayDiNeuCan() {
        if (!this.laLuotCuaMay()) return;
        if (this.mayDangDi) return;
        if (this.vanDaKetThuc) return;

        this.mayDangDi = true;
        this.capNhatTrangThai(`May dang nghi... Luot ${this.layTenPhe(this.luotQuanDo)}`);
        this.scheduleOnce(() => this.thucHienNuocDiCuaMay(), 0.6);
    }

    private thucHienNuocDiCuaMay() {
        if (!this.laLuotCuaMay() || this.vanDaKetThuc) {
            this.mayDangDi = false;
            return;
        }

        const nuocDi = this.chonNuocDiCuaMay();

        if (!nuocDi) {
            this.mayDangDi = false;
            this.vanDaKetThuc = true;
            this.capNhatTrangThai(`${this.layTenPhe(this.luotQuanDo)} het nuoc di. Van co ket thuc.`);
            return;
        }

        if (nuocDi.quanBiAn) {
            console.log(`${this.layTenQuanCo(nuocDi.quanCo)} an ${this.layTenQuanCo(nuocDi.quanBiAn)}`);
            this.xoaQuanCo(nuocDi.quanBiAn);
        }

        this.banCoQuan[nuocDi.quanCo.hang][nuocDi.quanCo.cot] = null;
        this.banCoQuan[nuocDi.hang][nuocDi.cot] = nuocDi.quanCo;
        nuocDi.quanCo.hang = nuocDi.hang;
        nuocDi.quanCo.cot = nuocDi.cot;
        this.capNhatHienThiQuanCo(nuocDi.quanCo);

        this.xoaHighlightNuocDi();
        this.hangOCoDangChon = nuocDi.hang;
        this.cotOCoDangChon = nuocDi.cot;
        this.mayDangDi = false;
        this.veLaiBanCo();
        this.doiLuotSauKhiDi();
    }

    private chonNuocDiCuaMay(): NuocDiMay | null {
        const cacNuocDi: NuocDiMay[] = [];

        for (const hangQuan of this.banCoQuan) {
            for (const quanCo of hangQuan) {
                if (!quanCo || quanCo.laQuanDo !== this.mayLaQuanDo) continue;
                if (!quanCo.node || !quanCo.node.isValid) continue;

                const nuocDiHopLe = KiemTraNuocDi.layNuocDiHopLeAnToan(quanCo, this.banCoQuan);

                for (const nuocDi of nuocDiHopLe) {
                    const quanBiAn = this.banCoQuan[nuocDi.hang][nuocDi.cot];
                    cacNuocDi.push({
                        quanCo,
                        hang: nuocDi.hang,
                        cot: nuocDi.cot,
                        quanBiAn
                    });
                }
            }
        }

        if (cacNuocDi.length === 0) return null;

        const cacNuocAnQuan = cacNuocDi.filter((nuocDi) => !!nuocDi.quanBiAn);
        const danhSachUuTien = cacNuocAnQuan.length > 0 ? cacNuocAnQuan : cacNuocDi;

        return danhSachUuTien[Math.floor(Math.random() * danhSachUuTien.length)];
    }

    private veLaiBanCo() {
        this.veKhungBanCo();
        this.veHighlight();

        for (const quanCo of this.danhSachQuanCo) {
            if (quanCo.node && quanCo.node.isValid) {
                this.capNhatHienThiQuanCo(quanCo);
            }
        }
    }

    private veKhungBanCo() {
        if (!this.veBanCo2D) return;

        const g = this.veBanCo2D;
        const trai = this.xCot(0);
        const phai = this.xCot(this.soCot - 1);
        const duoi = this.yHang(0);
        const tren = this.yHang(this.soHang - 1);

        g.clear();
        g.fillColor = new Color(222, 176, 104, 255);
        g.roundRect(-this.chieuRongBanCo() / 2, -this.chieuCaoBanCo() / 2, this.chieuRongBanCo(), this.chieuCaoBanCo(), 12);
        g.fill();

        if (this.dungAnhBanCo) {
            return;
        }

        g.strokeColor = new Color(88, 55, 28, 255);
        g.lineWidth = 3;

        for (let cot = 0; cot < this.soCot; cot++) {
            const x = this.xCot(cot);
            g.moveTo(x, duoi);
            g.lineTo(x, tren);
        }

        for (let hang = 0; hang < this.soHang; hang++) {
            const y = this.yHang(hang);
            g.moveTo(trai, y);
            g.lineTo(phai, y);
        }

        this.veDuongCheoCung(g, true);
        this.veDuongCheoCung(g, false);
        g.stroke();

        this.veChuSong('楚河', -this.canhOCo * 1.65);
        this.veChuSong('漢界', this.canhOCo * 1.65);
    }

    private veDuongCheoCung(g: Graphics, laQuanDo: boolean) {
        const hangDau = laQuanDo ? 0 : 7;
        const hangCuoi = laQuanDo ? 2 : 9;
        const trai = this.xCot(3);
        const phai = this.xCot(5);
        const duoi = this.yHang(hangDau);
        const tren = this.yHang(hangCuoi);

        g.moveTo(trai, duoi);
        g.lineTo(phai, tren);
        g.moveTo(phai, duoi);
        g.lineTo(trai, tren);
    }

    private veChuSong(noiDung: string, x: number) {
        const nodeCu = this.nodeBanCo2D?.getChildByName(`Song-${noiDung}`);
        if (nodeCu) return;

        const nodeChu = new Node(`Song-${noiDung}`);
        nodeChu.layer = Layers.Enum.UI_2D;
        nodeChu.setPosition(new Vec3(x, (this.yHang(4) + this.yHang(5)) / 2, 0));
        this.nodeBanCo2D!.addChild(nodeChu);
        nodeChu.addComponent(UITransform).setContentSize(150, 44);

        const label = nodeChu.addComponent(Label);
        label.string = noiDung;
        label.fontSize = 30;
        label.lineHeight = 34;
        label.horizontalAlign = HorizontalTextAlignment.CENTER;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.color = new Color(112, 67, 30, 190);
        label.isBold = true;
    }

    private veHighlight() {
        if (!this.veHighlight2D) return;

        const g = this.veHighlight2D;
        g.clear();

        if (this.hangOCoDangChon !== null && this.cotOCoDangChon !== null) {
            this.veVongTronHighlight(g, this.hangOCoDangChon, this.cotOCoDangChon, new Color(255, 206, 72, 190), this.canhOCo * 0.42);
        }

        for (const nuocDi of this.cacONuocDiHopLe) {
            const coQuan = !!this.banCoQuan[nuocDi.hang][nuocDi.cot];
            this.veVongTronHighlight(
                g,
                nuocDi.hang,
                nuocDi.cot,
                coQuan ? new Color(222, 64, 64, 190) : new Color(70, 170, 104, 170),
                coQuan ? this.canhOCo * 0.38 : this.canhOCo * 0.17
            );
        }
    }

    private veVongTronHighlight(g: Graphics, hang: number, cot: number, mau: Color, banKinh: number) {
        g.fillColor = mau;
        g.circle(this.xCot(cot), this.yHang(hang), banKinh);
        g.fill();
    }

    private capNhatHienThiQuanCo(quanCo: QuanCo) {
        const nodeQuan = this.cacNodeQuanCo.get(quanCo);
        if (!nodeQuan || !nodeQuan.isValid) return;

        nodeQuan.setPosition(this.layViTriQuanCo2D(quanCo.hang, quanCo.cot));

        const graphics = nodeQuan.getComponent(Graphics);
        const label = nodeQuan.getComponentInChildren(Label);
        const dangChon = this.quanDangChon === quanCo;

        if (graphics) {
            graphics.clear();
            graphics.fillColor = quanCo.laQuanDo
                ? new Color(248, 232, 207, 255)
                : new Color(238, 227, 210, 255);
            graphics.strokeColor = dangChon
                ? new Color(255, 208, 62, 255)
                : (quanCo.laQuanDo ? new Color(170, 38, 32, 255) : new Color(36, 36, 36, 255));
            graphics.lineWidth = dangChon ? 5 : 3;
            graphics.circle(0, 0, this.canhOCo * 0.36);
            graphics.fill();
            graphics.stroke();
        }

        if (label) {
            label.color = quanCo.laQuanDo ? new Color(187, 30, 28, 255) : new Color(24, 24, 24, 255);
        }
    }

    private xoaQuanCo(quanCo: QuanCo) {
        const nodeQuan = this.cacNodeQuanCo.get(quanCo);

        if (nodeQuan && nodeQuan.isValid) {
            nodeQuan.destroy();
        }

        this.cacNodeQuanCo.delete(quanCo);
        this.banCoQuan[quanCo.hang][quanCo.cot] = null;
    }

    private xoaHighlightNuocDi() {
        this.cacONuocDiHopLe = [];
        this.hangOCoDangChon = null;
        this.cotOCoDangChon = null;
    }

    private laONuocDiHopLe(viTri: ViTriBanCo): boolean {
        return this.cacONuocDiHopLe.some((nuocDi) => {
            return nuocDi.hang === viTri.hang && nuocDi.cot === viTri.cot;
        });
    }

    private layViTriBanCoTuManHinh(xManHinh: number, yManHinh: number): ViTriBanCo | null {
        if (!this.cameraCanvas || !this.nodeBanCo2D) return null;

        const transformBanCo = this.nodeBanCo2D.getComponent(UITransform);
        if (!transformBanCo) return null;

        const viTriTheGioi = this.cameraCanvas.screenToWorld(new Vec3(xManHinh, yManHinh, 0));
        const viTriTrongBanCo = transformBanCo.convertToNodeSpaceAR(viTriTheGioi);
        const x = viTriTrongBanCo.x;
        const y = viTriTrongBanCo.y;
        const cot = Math.round((x - this.xCot(0)) / this.canhOCo);
        const hang = Math.round((y - this.yHang(0)) / this.canhOCo);

        if (hang < 0 || hang >= this.soHang || cot < 0 || cot >= this.soCot) return null;

        const khoangCachX = Math.abs(x - this.xCot(cot));
        const khoangCachY = Math.abs(y - this.yHang(hang));
        if (khoangCachX > this.canhOCo * 0.45 || khoangCachY > this.canhOCo * 0.45) return null;

        return { hang, cot };
    }

    private layViTriQuanCo2D(hang: number, cot: number): Vec3 {
        return new Vec3(this.xCot(cot), this.yHang(hang), 0);
    }

    private xCot(cot: number): number {
        return -this.chieuRongBanCo() / 2 + this.leBanCo + cot * this.canhOCo;
    }

    private yHang(hang: number): number {
        return -this.chieuCaoBanCo() / 2 + this.leBanCo + hang * this.canhOCo;
    }

    private chieuRongBanCo(): number {
        return this.canhOCo * (this.soCot - 1) + this.leBanCo * 2;
    }

    private chieuCaoBanCo(): number {
        return this.canhOCo * (this.soHang - 1) + this.leBanCo * 2;
    }

    private layTenQuanCoNgan(loaiQuan: LoaiQuan, laQuanDo: boolean): string {
        switch (loaiQuan) {
            case LoaiQuan.TUONG_SOAI:
                return laQuanDo ? '帥' : '將';
            case LoaiQuan.SI:
                return laQuanDo ? '仕' : '士';
            case LoaiQuan.TUONG_VOI:
                return laQuanDo ? '相' : '象';
            case LoaiQuan.XE:
                return '車';
            case LoaiQuan.MA:
                return '馬';
            case LoaiQuan.PHAO:
                return laQuanDo ? '炮' : '砲';
            case LoaiQuan.TOT:
                return laQuanDo ? '兵' : '卒';
            default:
                return '?';
        }
    }

    private layTenQuanCo(quanCo: QuanCo): string {
        switch (quanCo.loaiQuan) {
            case LoaiQuan.TUONG_SOAI:
                return quanCo.laQuanDo ? 'Tuong soai do' : 'Tuong soai den';
            case LoaiQuan.SI:
                return quanCo.laQuanDo ? 'Si do' : 'Si den';
            case LoaiQuan.TUONG_VOI:
                return quanCo.laQuanDo ? 'Tuong voi do' : 'Tuong voi den';
            case LoaiQuan.XE:
                return quanCo.laQuanDo ? 'Xe do' : 'Xe den';
            case LoaiQuan.MA:
                return quanCo.laQuanDo ? 'Ma do' : 'Ma den';
            case LoaiQuan.PHAO:
                return quanCo.laQuanDo ? 'Phao do' : 'Phao den';
            case LoaiQuan.TOT:
                return quanCo.laQuanDo ? 'Tot do' : 'Tot den';
            default:
                return quanCo.laQuanDo ? 'Quan do' : 'Quan den';
        }
    }

    private layTenPhe(laQuanDo: boolean): string {
        return laQuanDo ? 'quan do' : 'quan den';
    }
}
