import {
    _decorator,
    Component,
    Prefab,
    instantiate,
    Vec3,
    Camera,
    input,
    Input,
    EventMouse,
    EventKeyboard,
    KeyCode,
    PhysicsSystem,
    geometry,
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
    resources,
    Texture2D,
    MeshRenderer,
    Sprite,
    SpriteFrame
} from 'cc';

import { OCo } from './Tile';
import { QuanCo, LoaiQuan } from './Piece';
import { KiemTraNuocDi, BanCoQuan } from './MoveValidator';

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
    private oDangChon: OCo | null = null;
    private cacONuocDiHopLe: OCo[] = [];
    private danhSachOCo: OCo[][] = [];
    private banCoQuan: BanCoQuan = [];
    private danhSachQuanCo: QuanCo[] = [];
    private luotQuanDo = true;
    private vanDaKetThuc = false;
    private nhanTrangThai: Label | null = null;
    private mayDangDi = false;
    private nodeCanvas: Node | null = null;
    private cameraCanvas: Camera | null = null;
    private cacLabelQuanCo: Map<QuanCo, Label> = new Map();

    private readonly soHang = 10;
    private readonly soCot = 9;
    private readonly khoangCachO = 1.2;
    private readonly doCaoQuanCo = 0.55;
    private readonly choiVoiMay = true;
    private readonly mayLaQuanDo = false;

    start() {
        this.timCameraChinhNeuCan();
        this.taoCanvasUI();
        this.taoGiaoDienTrangThai();
        this.taoBanCo();
        this.taoCacQuanCoBanDau();
        this.inLuotHienTai();
        this.taiVaApDungTextureBanCo();
        input.on(Input.EventType.MOUSE_DOWN, this.khiBamChuot, this);
        input.on(Input.EventType.KEY_DOWN, this.khiBamPhim, this);
    }

    update(deltaTime: number) {
        this.capNhatViTriLabelQuanCo();
    }

    onDestroy() {
        input.off(Input.EventType.MOUSE_DOWN, this.khiBamChuot, this);
        input.off(Input.EventType.KEY_DOWN, this.khiBamPhim, this);
        this.xoaTatCaLabelQuanCo();

        if (this.nodeCanvas && this.nodeCanvas.isValid) {
            this.nodeCanvas.destroy();
        }

        this.nodeCanvas = null;
        this.cameraCanvas = null;
    }

    private taiVaApDungTextureBanCo() {
        // Ẩn bảng 3D Plane cũ
        const nodeBanCo = this.node.getChildByName('ChessBoard');
        if (nodeBanCo) {
            nodeBanCo.active = false;
        }

        // Tạo Node mới chứa ảnh 2D Sprite
        const nodeSpriteBanCo = new Node('SpriteBanCo');
        
        // Thêm component UITransform để gán kích thước
        const transform = nodeSpriteBanCo.addComponent(UITransform);
        // Thiết lập kích thước đủ bao trọn lưới toạ độ (lưới khoảng 9.6 x 10.8)
        transform.setContentSize(10.6, 11.6);
        
        // Thêm component Sprite
        const sprite = nodeSpriteBanCo.addComponent(Sprite);
        
        // Đặt mặt phẳng song song với sàn (xoay -90 độ trục X)
        nodeSpriteBanCo.setRotationFromEuler(-90, 0, 0);
        // Hạ xuống một chút (-0.01) để không đè lên phần highlight của các ô cờ
        nodeSpriteBanCo.setPosition(new Vec3(0, -0.01, 0));
        
        this.node.addChild(nodeSpriteBanCo);

        // Load ảnh dưới dạng SpriteFrame
        resources.load('board/spriteFrame', SpriteFrame, (err, spriteFrame) => {
            if (err) {
                console.error('Loi khi load sprite ban co:', err);
                return;
            }
            
            sprite.spriteFrame = spriteFrame;
        });
    }

    private timCameraChinhNeuCan() {
        if (this.cameraChinh) {
            this.datGocNhinQuanDo();
            return;
        }

        const nodeCamera = find('Main Camera');
        this.cameraChinh = nodeCamera?.getComponent(Camera) ?? null;
        this.datGocNhinQuanDo();
    }

    private datGocNhinQuanDo() {
        if (!this.cameraChinh) return;

        this.cameraChinh.node.setPosition(new Vec3(0, 15, -15));
        this.cameraChinh.node.lookAt(new Vec3(0, 0, 0));
    }

    private taoCanvasUI() {
        this.nodeCanvas = new Node('CanvasQuanCo');
        this.nodeCanvas.layer = Layers.Enum.UI_2D;

        const nodeCameraCanvas = new Node('CameraCanvasQuanCo');
        nodeCameraCanvas.layer = Layers.Enum.UI_2D;
        this.nodeCanvas.addChild(nodeCameraCanvas);

        this.cameraCanvas = nodeCameraCanvas.addComponent(Camera);
        this.cameraCanvas.projection = Camera.ProjectionType.ORTHO;
        this.cameraCanvas.visibility = Layers.Enum.UI_2D;
        this.cameraCanvas.clearFlags = Camera.ClearFlag.DEPTH_ONLY;
        this.cameraCanvas.priority = (this.cameraChinh?.priority ?? 0) + 1;

        const kichThuocManHinh = view.getVisibleSize();
        const bienDangCanvas = this.nodeCanvas.addComponent(UITransform);
        bienDangCanvas.setContentSize(kichThuocManHinh.width, kichThuocManHinh.height);

        const canvas = this.nodeCanvas.addComponent(Canvas);
        canvas.cameraComponent = this.cameraCanvas;
        canvas.alignCanvasWithScreen = true;
        this.nodeCanvas.setPosition(new Vec3(kichThuocManHinh.width / 2, kichThuocManHinh.height / 2, 0));
        this.node.scene?.addChild(this.nodeCanvas);
    }

    private capNhatViTriLabelQuanCo() {
        if (!this.cameraChinh || !this.nodeCanvas) return;

        for (const quanCo of this.danhSachQuanCo) {
            if (!quanCo.node || !quanCo.node.isValid) continue;

            let label = this.cacLabelQuanCo.get(quanCo);
            if (!label) {
                label = this.taoLabelChoQuan(quanCo);
                this.cacLabelQuanCo.set(quanCo, label);
            }

            const viTriTheGioi = quanCo.node.worldPosition.clone();
            viTriTheGioi.y += 0.6;

            const viTriManHinh = this.cameraChinh.convertToUINode(viTriTheGioi, this.nodeCanvas);
            if (viTriManHinh) {
                label.node.setPosition(viTriManHinh);
            }
        }
    }

    private taoLabelChoQuan(quanCo: QuanCo): Label {
        const nodeLabel = new Node('LabelQuanCo');
        nodeLabel.layer = Layers.Enum.UI_2D;
        this.nodeCanvas!.addChild(nodeLabel);

        const bienDang = nodeLabel.addComponent(UITransform);
        bienDang.setContentSize(120, 60);

        const label = nodeLabel.addComponent(Label);
        label.fontSize = 32;
        label.lineHeight = 36;
        label.horizontalAlign = HorizontalTextAlignment.CENTER;
        label.verticalAlign = VerticalTextAlignment.CENTER;
        label.overflow = Overflow.SHRINK;
        label.enableWrapText = false;
        label.isBold = true;
        label.color = new Color(255, 255, 255, 255);
        label.outlineColor = new Color(0, 0, 0, 255);
        label.outlineWidth = 2;

        label.string = this.layTenQuanCoLabel(quanCo);

        return label;
    }

    private layTenQuanCoLabel(quanCo: QuanCo): string {
        switch (quanCo.loaiQuan) {
            case LoaiQuan.TUONG_SOAI:
                return quanCo.laQuanDo ? 'TƯỚNG' : 'SOÁI';
            case LoaiQuan.SI:
                return 'SĨ';
            case LoaiQuan.TUONG_VOI:
                return 'TƯỢNG';
            case LoaiQuan.XE:
                return 'XE';
            case LoaiQuan.MA:
                return 'MÃ';
            case LoaiQuan.PHAO:
                return 'PHÁO';
            case LoaiQuan.TOT:
                return quanCo.laQuanDo ? 'TỐT' : 'BINH';
            default:
                return '?';
        }
    }

    private taoBanCo() {
        this.danhSachOCo = [];
        this.banCoQuan = [];

        for (let hang = 0; hang < this.soHang; hang++) {
            this.danhSachOCo[hang] = [];
            this.banCoQuan[hang] = [];

            for (let cot = 0; cot < this.soCot; cot++) {
                this.banCoQuan[hang][cot] = null;

                if (!this.prefabOCo) return;

                const nodeOCo = instantiate(this.prefabOCo);

                nodeOCo.setPosition(new Vec3(
                    cot * this.khoangCachO - 4.8,
                    0.03,
                    hang * this.khoangCachO - 5.4
                ));

                const oCo = nodeOCo.getComponent(OCo);
                oCo?.khoiTao(hang, cot);

                this.node.addChild(nodeOCo);

                if (oCo) {
                    this.danhSachOCo[hang][cot] = oCo;
                }
            }
        }
    }

    private taoCacQuanCoBanDau() {
        if (!this.prefabQuanCo) {
            console.log('Chua gan prefabQuanCo');
            return;
        }

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
        if (!this.prefabQuanCo) return;

        const oCo = this.layOCo(cauHinh.hang, cauHinh.cot);

        if (!oCo) return;

        const nodeQuanCo = instantiate(this.prefabQuanCo);
        const quanCo = nodeQuanCo.getComponent(QuanCo);

        this.node.addChild(nodeQuanCo);
        nodeQuanCo.setWorldPosition(this.layViTriQuanCo(oCo));

        if (quanCo) {
            quanCo.khoiTao(cauHinh.hang, cauHinh.cot, cauHinh.loaiQuan, cauHinh.laQuanDo);
            this.banCoQuan[cauHinh.hang][cauHinh.cot] = quanCo;
            this.danhSachQuanCo.push(quanCo);
        }
    }

    private khiBamChuot(suKien: EventMouse) {
        if (this.vanDaKetThuc) return;
        if (this.laLuotCuaMay()) return;

        if (!this.cameraChinh) {
            console.log('Chua gan cameraChinh');
            return;
        }

        const tiaBam = new geometry.Ray();
        this.cameraChinh.screenPointToRay(
            suKien.getLocationX(),
            suKien.getLocationY(),
            tiaBam
        );

        if (!PhysicsSystem.instance.raycast(tiaBam)) return;

        const { quanCo, oCo } = this.layDoiTuongDuocBam();

        if (quanCo) {
            if (this.coTheAnQuanDangBam(quanCo)) {
                this.anQuanVaDiChuyen(quanCo);
                return;
            }

            this.chonQuanCo(quanCo);
            return;
        }

        if (oCo) {
            this.thuDiChuyenQuanDangChon(oCo);
        }
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

        this.xoaODangChon();
        this.xoaHighlightNuocDi();

        if (this.quanDangChon && this.quanDangChon !== quanCo) {
            this.quanDangChon.boChon();
        }

        this.quanDangChon = quanCo;
        this.quanDangChon.chon();
        console.log(`Da chon ${this.layTenQuanCo(quanCo)} tai hang=${quanCo.hang}, cot=${quanCo.cot}`);

        this.hienCacNuocDiHopLe(quanCo);
    }

    private thuDiChuyenQuanDangChon(oCo: OCo) {
        if (!this.quanDangChon) return;
        if (!this.laONuocDiHopLe(oCo)) return;

        this.diChuyenQuanDangChonDen(oCo);
    }

    private coTheAnQuanDangBam(quanBiAn: QuanCo): boolean {
        if (!this.quanDangChon) return false;
        if (this.quanDangChon === quanBiAn) return false;
        if (this.quanDangChon.laQuanDo === quanBiAn.laQuanDo) return false;

        const oCoBiAn = this.layOCo(quanBiAn.hang, quanBiAn.cot);

        return !!oCoBiAn && this.laONuocDiHopLe(oCoBiAn);
    }

    private anQuanVaDiChuyen(quanBiAn: QuanCo) {
        const oCoBiAn = this.layOCo(quanBiAn.hang, quanBiAn.cot);

        if (!oCoBiAn) return;

        console.log(`${this.layTenQuanCo(this.quanDangChon!)} an ${this.layTenQuanCo(quanBiAn)}`);
        this.xoaLabelQuanCo(quanBiAn);
        quanBiAn.node.destroy();
        this.diChuyenQuanDangChonDen(oCoBiAn);
    }

    private diChuyenQuanDangChonDen(oCo: OCo) {
        if (!this.quanDangChon) return;

        const quanCo = this.quanDangChon;

        this.banCoQuan[quanCo.hang][quanCo.cot] = null;
        this.banCoQuan[oCo.hang][oCo.cot] = quanCo;

        quanCo.diChuyenDen(oCo.hang, oCo.cot, this.layViTriQuanCo(oCo));
        quanCo.boChon();

        this.quanDangChon = null;
        this.xoaHighlightNuocDi();
        this.chonOCo(oCo);
        this.doiLuotSauKhiDi();
    }

    private hienCacNuocDiHopLe(quanCo: QuanCo) {
        const cacNuocDi = KiemTraNuocDi.layNuocDiHopLeAnToan(quanCo, this.banCoQuan);

        for (const nuocDi of cacNuocDi) {
            const oCo = this.layOCo(nuocDi.hang, nuocDi.cot);

            if (oCo) {
                oCo.hienNuocDiHopLe();
                this.cacONuocDiHopLe.push(oCo);
            }
        }
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
        this.xoaODangChon();

        if (this.quanDangChon) {
            this.quanDangChon.boChon();
            this.quanDangChon = null;
        }

        for (const quanCo of this.danhSachQuanCo) {
            if (quanCo.node && quanCo.node.isValid) {
                quanCo.node.destroy();
            }
        }

        this.danhSachQuanCo = [];
        this.xoaTatCaLabelQuanCo();

        for (let hang = 0; hang < this.soHang; hang++) {
            for (let cot = 0; cot < this.soCot; cot++) {
                this.banCoQuan[hang][cot] = null;
            }
        }

        this.luotQuanDo = true;
        this.vanDaKetThuc = false;
        this.mayDangDi = false;
        this.taoCacQuanCoBanDau();
        this.capNhatTrangThai('Da reset van co');
        this.inLuotHienTai();
    }

    private inLuotHienTai() {
        this.capNhatTrangThai(`Luot ${this.layTenPhe(this.luotQuanDo)}`);
    }

    private taoGiaoDienTrangThai() {
        const nodeTrangThai = new Node('TrangThaiVanCo');
        nodeTrangThai.setPosition(new Vec3(0, 0.2, 6.6));
        nodeTrangThai.setRotationFromEuler(-60, 0, 0);
        nodeTrangThai.setScale(new Vec3(0.012, 0.012, 0.012));
        this.node.addChild(nodeTrangThai);

        const bienDang = nodeTrangThai.addComponent(UITransform);
        bienDang.setContentSize(900, 90);

        this.nhanTrangThai = nodeTrangThai.addComponent(Label);
        this.nhanTrangThai.fontSize = 42;
        this.nhanTrangThai.lineHeight = 48;
        this.nhanTrangThai.horizontalAlign = HorizontalTextAlignment.CENTER;
        this.nhanTrangThai.verticalAlign = VerticalTextAlignment.CENTER;
        this.nhanTrangThai.color = new Color(255, 245, 180, 255);
        this.nhanTrangThai.isBold = true;
        this.nhanTrangThai.outlineColor = new Color(0, 0, 0, 255);
        this.nhanTrangThai.outlineWidth = 3;
    }

    private capNhatTrangThai(noiDung: string) {
        console.log(noiDung);

        if (this.nhanTrangThai) {
            this.nhanTrangThai.string = `${noiDung}\nNhan R de choi lai`;
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

        const oCo = this.layOCo(nuocDi.hang, nuocDi.cot);

        if (!oCo) {
            this.mayDangDi = false;
            return;
        }

        if (nuocDi.quanBiAn) {
            console.log(`${this.layTenQuanCo(nuocDi.quanCo)} an ${this.layTenQuanCo(nuocDi.quanBiAn)}`);
            this.xoaLabelQuanCo(nuocDi.quanBiAn);
            nuocDi.quanBiAn.node.destroy();
        }

        this.banCoQuan[nuocDi.quanCo.hang][nuocDi.quanCo.cot] = null;
        this.banCoQuan[nuocDi.hang][nuocDi.cot] = nuocDi.quanCo;
        nuocDi.quanCo.diChuyenDen(nuocDi.hang, nuocDi.cot, this.layViTriQuanCo(oCo));

        this.xoaHighlightNuocDi();
        this.chonOCo(oCo);
        this.mayDangDi = false;
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

    private xoaHighlightNuocDi() {
        for (const oCo of this.cacONuocDiHopLe) {
            oCo.datLaiMau();
        }

        this.cacONuocDiHopLe = [];
    }

    private xoaLabelQuanCo(quanCo: QuanCo) {
        const label = this.cacLabelQuanCo.get(quanCo);

        if (label) {
            label.node.destroy();
            this.cacLabelQuanCo.delete(quanCo);
        }
    }

    private xoaTatCaLabelQuanCo() {
        for (const label of this.cacLabelQuanCo.values()) {
            if (label.node && label.node.isValid) {
                label.node.destroy();
            }
        }

        this.cacLabelQuanCo.clear();
    }

    private chonOCo(oCo: OCo) {
        this.xoaODangChon();
        this.oDangChon = oCo;
        this.oDangChon.chon();
    }

    private xoaODangChon() {
        if (this.oDangChon) {
            this.oDangChon.datLaiMau();
            this.oDangChon = null;
        }
    }

    private laONuocDiHopLe(oCo: OCo): boolean {
        return this.cacONuocDiHopLe.indexOf(oCo) !== -1;
    }

    private layDoiTuongDuocBam(): { quanCo: QuanCo | null, oCo: OCo | null } {
        let quanCo: QuanCo | null = null;
        let oCo: OCo | null = null;

        for (const ketQua of PhysicsSystem.instance.raycastResults) {
            const node = ketQua.collider.node;

            if (!quanCo) {
                quanCo = node.getComponent(QuanCo);
            }

            if (!oCo) {
                oCo = node.getComponent(OCo);
            }

            if (quanCo && oCo) break;
        }

        return { quanCo, oCo };
    }

    private layOCo(hang: number, cot: number): OCo | null {
        return this.danhSachOCo[hang]?.[cot] ?? null;
    }

    private layViTriQuanCo(oCo: OCo): Vec3 {
        const viTri = oCo.node.worldPosition.clone();
        viTri.y += this.doCaoQuanCo;
        return viTri;
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
