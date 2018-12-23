import { Observable } from "rxjs";
import { ITraining } from "./training.d";
import { ISkill } from "./skill";

export default interface INotion {
  acceleration(...labels: string[]): Observable<any>;
  awareness(...labels: string[]): Observable<any>;
  brainwaves(...labels: string[]): Observable<any>;
  channelAnalysis(...labels: string[]): Observable<any>;
  emotion(...labels: string[]): Observable<any>;
  facialExpression(...labels: string[]): Observable<any>;
  getInfo(): Promise<any>;
  kinesis(...labels: string[]): Observable<any>;
  predictions(...labels: string[]): Observable<any>;
  status(...labels: string[]): Observable<any>;
  training: ITraining;
  skill(id: string): ISkill;
}
