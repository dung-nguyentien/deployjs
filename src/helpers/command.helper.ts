export class CommandHelper {
    public command: string;

    public static create() {
        return new CommandHelper();
    }

    public cd(folder) {
        this.command += ` cd ${folder} `;
        return this;
    }

    public ln(option, first, last) {
        this.command += ` ln ${option} ${first} ${last} `;
        return this;
    }

    public mv(option, first, last) {
        this.command += ` mv ${option} ${first} ${last} `;
        return this;
    }

    public and() {
        this.command += ` && `;
        return this;
    }

    public echo(message) {
        this.command += ` echo "${message}"; `;
        return this;
    }

    public if(condition) {
        this.command += ` if ${condition} `;

        return this;
    }

    public then() {
        this.command += ` then `;
        return this;
    }

    public else() {
        this.command += ` else `;
        return this;
    }

    public endIf() {
        this.command += ` fi `;
        return this;
    }

}