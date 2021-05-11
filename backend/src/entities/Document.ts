import { Entity, PrimaryGeneratedColumn, Column, Index } from "typeorm";

@Entity({
  name: "documents",
})
export default class Document {
  @PrimaryGeneratedColumn({ type: "int" })
  id?: number;

  @Index()
  @Column({ type: "datetime" })
  createDate?: Date;

  @Column({ type: "datetime" })
  updateDate?: Date;

  @Column({ type: "varchar" })
  key!: string;

  @Column({ type: "varchar" })
  title!: string;

  @Column({ type: "varchar" })
  contentType?: string;

  @Column({ type: "mediumtext", nullable: true })
  description?: string;

  @Index()
  @Column({ type: "varchar" })
  userId?: string;

  @Column({ type: "int" })
  size!: number;
}
