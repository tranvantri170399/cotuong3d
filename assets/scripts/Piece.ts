import {
    _decorator,
    Component,
    Vec3,
    MeshRenderer,
    Color,
    Material,
    Enum,
    Node,
    Label,
    LabelOutline,
    UITransform,
    HorizontalTextAlignment,
    VerticalTextAlignment,
    Overflow
} from 'cc';

const { ccclass, property } = _decorator;

export enum LoaiQuan {
    TUONG_SOAI,
    SI,
    TUONG_VOI,
    XE,
    MA,
    PHAO,
    TOT
}

Enum(LoaiQuan);

@ccclass('Piece')
export class QuanCo extends Component {

    public hang = 0;
    public cot = 0;

    @property({ type: Enum(LoaiQuan) })
    public loaiQuan: LoaiQuan = LoaiQuan.XE;

    @property
    public laQuanDo = true;

    private hienThiMesh: MeshRenderer | null = null;
    private vatLieu: Material | null = null;
    private readonly mauDangChon = new Color(255, 220, 0, 255);
    private readonly mauQuanDo = new Color(210, 35, 35, 255);
    private readonly mauQuanDen = new Color(35, 35, 35, 255);
    private chuQuanCo: Label | null = null;

    onLoad() {
        this.luuVatLieu();
        this.taoChuTrenQuan();
        this.boChon();
    }

    public khoiTao(hang: number, cot: number, loaiQuan: LoaiQuan = this.loaiQuan, laQuanDo: boolean = this.laQuanDo) {
        this.hang = hang;
        this.cot = cot;
        this.loaiQuan = loaiQuan;
        this.laQuanDo = laQuanDo;
        this.boChon();
        this.capNhatChuQuanCo();
    }

    public chon() {
        this.doiMauQuan(this.mauDangChon);
    }

    public boChon() {
        this.doiMauQuan(this.laQuanDo ? this.mauQuanDo : this.mauQuanDen);
    }

    public diChuyenDen(hang: number, cot: number, viTriTheGioi: Vec3) {
        this.hang = hang;
        this.cot = cot;
        this.node.setWorldPosition(viTriTheGioi);
    }

    private luuVatLieu() {
        this.hienThiMesh = this.getComponent(MeshRenderer);

        if (this.hienThiMesh) {
            this.vatLieu = this.hienThiMesh.getMaterialInstance(0);
        }
    }

    private doiMauQuan(mau: Color) {
        if (!this.vatLieu) {
            this.luuVatLieu();
        }

        if (this.vatLieu) {
            this.vatLieu.setProperty('mainColor', mau);
        }
    }

    private taoChuTrenQuan() {
        const nodeChu = new Node('ChuQuanCo');
        nodeChu.setPosition(new Vec3(0, 0.72, 0));
        nodeChu.setRotationFromEuler(-90, 0, 0);
        nodeChu.setScale(new Vec3(0.01, 0.01, 0.01));
        this.node.addChild(nodeChu);

        const bienDangChu = nodeChu.addComponent(UITransform);
        bienDangChu.setContentSize(140, 70);

        this.chuQuanCo = nodeChu.addComponent(Label);
        this.chuQuanCo.fontSize = 36;
        this.chuQuanCo.lineHeight = 40;
        this.chuQuanCo.horizontalAlign = HorizontalTextAlignment.CENTER;
        this.chuQuanCo.verticalAlign = VerticalTextAlignment.CENTER;
        this.chuQuanCo.overflow = Overflow.SHRINK;
        this.chuQuanCo.enableWrapText = false;
        this.chuQuanCo.isBold = true;
        this.chuQuanCo.color = new Color(255, 255, 255, 255);

        const vienChu = nodeChu.addComponent(LabelOutline);
        vienChu.color = new Color(0, 0, 0, 255);
        vienChu.width = 2;

        this.capNhatChuQuanCo();
    }

    private capNhatChuQuanCo() {
        if (!this.chuQuanCo) return;

        this.chuQuanCo.string = this.layChuQuanCo();
    }

    private layChuQuanCo(): string {
        switch (this.loaiQuan) {
            case LoaiQuan.TUONG_SOAI:
                return 'TUONG';
            case LoaiQuan.SI:
                return 'SI';
            case LoaiQuan.TUONG_VOI:
                return 'VOI';
            case LoaiQuan.XE:
                return 'XE';
            case LoaiQuan.MA:
                return 'MA';
            case LoaiQuan.PHAO:
                return 'PHAO';
            case LoaiQuan.TOT:
                return 'TOT';
            default:
                return '?';
        }
    }
}
