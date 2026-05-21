import {
    _decorator,
    Component,
    Vec3,
    MeshRenderer,
    Color,
    Material,
    Enum
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

    onLoad() {
        this.luuVatLieu();
        this.boChon();
    }

    public khoiTao(hang: number, cot: number, loaiQuan: LoaiQuan = this.loaiQuan, laQuanDo: boolean = this.laQuanDo) {
        this.hang = hang;
        this.cot = cot;
        this.loaiQuan = loaiQuan;
        this.laQuanDo = laQuanDo;
        this.boChon();
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
}
