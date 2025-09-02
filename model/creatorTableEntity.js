class CreatorTableEntity {
    constructor({
        idx,
        platform,
        biography,
        followers,
        followings,
        full_name,
        ig_id,
        category_name,
        username,
        profile_pic_url,
        relate_profile,
        created_at,
        updated_at
    }) {
        this.idx = idx;                                 // Primary Key
        this.platform = platform;                       // 플랫폼 (예: 'instagram')
        this.biography = biography;                     // 자기소개
        this.followers = followers;                     // 팔로워 수
        this.followings = followings;                   // 팔로잉 수
        this.full_name = full_name;                     // 전체 이름
        this.ig_id = ig_id;                             // Instagram 고유 ID
        this.category_name = category_name;             // 카테고리 (예: 'Fashion Model')
        this.username = username;                       // 인스타 사용자명
        this.profile_pic_url = profile_pic_url;         // 프로필 이미지 URL
        this.relate_profile = relate_profile;           // 연관 프로필 (json 형태)
        this.created_at = created_at;                   // 생성일
        this.updated_at = updated_at;                   // 수정일
    }
}

module.exports = CreatorTableEntity;